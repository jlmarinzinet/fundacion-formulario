"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { normalizeOptions } from "../../../lib/normalize";
import { api } from "../../../lib/url";
import type {
  MetadataOptions,
  MetadataPayload,
  MetadataResponse,
  OptionItem,
} from "../../../lib/types";

const WEBHOOK_ERROR =
  "No se pudo cargar la metadata. Intenta de nuevo más tarde.";

/** Client-side file-size limits (bytes). */
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per image
const MAX_TOTAL_UPLOAD = 50 * 1024 * 1024; // 50 MB total

function isDocFile(name: string) {
  const lower = name.toLowerCase();
  return lower.endsWith(".doc") || lower.endsWith(".docx");
}

type SubmitStatus = "idle" | "pending" | "success" | "error";

type MultiSelectProps = {
  label: string;
  options: OptionItem[];
  selected: OptionItem[];
  onChange: (next: OptionItem[]) => void;
  disabled?: boolean;
};

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled = false,
}: MultiSelectProps) {
  const [query, setQuery] = useState("");

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.id)),
    [selected]
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(q)
    );
  }, [options, query]);

  const handleToggle = (option: OptionItem) => {
    if (selectedIds.has(option.id)) {
      onChange(selected.filter((item) => item.id !== option.id));
      return;
    }
    onChange([...selected, option]);
  };

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        <span className="text-xs text-slate-500">
          {selected.length} seleccionados
        </span>
      </div>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar..."
        disabled={disabled}
        className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 disabled:bg-slate-100"
      />
      <div className="mt-3 max-h-44 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
        {filteredOptions.length === 0 && (
          <p className="text-sm text-slate-500">Sin resultados.</p>
        )}
        {filteredOptions.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(option.id)}
              onChange={() => handleToggle(option)}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {selected.length === 0 && (
          <span className="text-xs text-slate-500">
            Ninguno seleccionado.
          </span>
        )}
        {selected.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700"
          >
            {item.label}
            <button
              type="button"
              onClick={() =>
                onChange(selected.filter((option) => option.id !== item.id))
              }
              disabled={disabled}
              className="rounded-full px-1 text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed"
              aria-label={`Quitar ${item.label}`}
            >
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function UploadForm() {
  const [metadata, setMetadata] = useState<MetadataOptions>({
    authors: [],
    categories: [],
    tags: [],
    organizations: [],
  });
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const [docFile, setDocFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [authors, setAuthors] = useState<OptionItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [tags, setTags] = useState<OptionItem[]>([]);
  const [organizations, setOrganizations] = useState<OptionItem[]>([]);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  /** Ref to abort an in-flight submit request on unmount or re-submit. */
  const submitControllerRef = useRef<AbortController | null>(null);

  /* ── Load metadata with proper AbortController cleanup ───── */
  useEffect(() => {
    const controller = new AbortController();

    const loadMetadata = async () => {
      setMetadataLoading(true);
      setMetadataError(null);
      try {
        const response = await fetch(api("/api/metadata"), {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Metadata error");
        }
        const data = (await response.json()) as MetadataResponse;
        const payload: MetadataPayload = Array.isArray(data)
          ? data[0] ?? {}
          : data;
        const normalized: MetadataOptions = {
          authors: normalizeOptions(payload.autores ?? []),
          categories: normalizeOptions(payload.categorias ?? []),
          tags: normalizeOptions(payload.etiquetas ?? []),
          organizations: normalizeOptions(payload.organizaciones ?? []),
        };
        if (!controller.signal.aborted) {
          setMetadata(normalized);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setMetadataError(WEBHOOK_ERROR);
        }
      } finally {
        if (!controller.signal.aborted) {
          setMetadataLoading(false);
        }
      }
    };

    loadMetadata();

    return () => {
      controller.abort();
    };
  }, []);

  /* ── Abort in-flight submit on unmount ────────────────────── */
  useEffect(() => {
    return () => {
      submitControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus("idle");
    setSubmitMessage(null);

    if (!docFile) {
      setSubmitStatus("error");
      setSubmitMessage("El documento es obligatorio.");
      return;
    }

    if (!isDocFile(docFile.name)) {
      setSubmitStatus("error");
      setSubmitMessage("El documento debe ser .doc o .docx.");
      return;
    }

    /* ── client-side size validation ───────────────────────── */
    if (docFile.size > MAX_DOC_SIZE) {
      setSubmitStatus("error");
      setSubmitMessage(
        `El documento excede ${MAX_DOC_SIZE / (1024 * 1024)} MB.`
      );
      return;
    }

    const oversizedImage = imageFiles.find((f) => f.size > MAX_IMAGE_SIZE);
    if (oversizedImage) {
      setSubmitStatus("error");
      setSubmitMessage(
        `La imagen "${oversizedImage.name}" excede ${MAX_IMAGE_SIZE / (1024 * 1024)} MB.`
      );
      return;
    }

    const totalSize =
      docFile.size + imageFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_UPLOAD) {
      setSubmitStatus("error");
      setSubmitMessage(
        `El tamaño total excede ${MAX_TOTAL_UPLOAD / (1024 * 1024)} MB.`
      );
      return;
    }

    /* ── build FormData ────────────────────────────────────── */
    const formData = new FormData();
    formData.append("documento_articulo", docFile);
    imageFiles.forEach((image) => {
      formData.append("imagenes", image);
    });
    formData.append(
      "authors_json",
      JSON.stringify(
        authors.map((item) => ({
          id: item.id,
          name: item.label,
          ...(item.slug ? { slug: item.slug } : {}),
        }))
      )
    );
    formData.append(
      "categories_json",
      JSON.stringify(
        categories.map((item) => ({ id: item.id, name: item.label }))
      )
    );
    formData.append(
      "tags_json",
      JSON.stringify(
        tags.map((item) => ({ id: item.id, name: item.label }))
      )
    );
    formData.append(
      "organizations_json",
      JSON.stringify(
        organizations.map((item) => ({ id: item.id, name: item.label }))
      )
    );

    /* ── submit with abort support ─────────────────────────── */
    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    setSubmitStatus("pending");
    try {
      const response = await fetch(api("/api/submit"), {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted) return;

      if (!response.ok || !payload?.ok) {
        setSubmitStatus("error");
        setSubmitMessage(
          payload?.error ? String(payload.error) : "No se pudo enviar."
        );
        return;
      }
      setSubmitStatus("success");
      setSubmitMessage("Envío completado correctamente.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setSubmitStatus("error");
      setSubmitMessage("No se pudo enviar. Intenta nuevamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-800">
          Documento del artículo
        </label>
        <input
          type="file"
          accept=".doc,.docx"
          required
          onChange={(event) =>
            setDocFile(event.target.files?.[0] ?? null)
          }
          className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
        />
        {docFile && (
          <p className="text-xs text-slate-600">
            Seleccionado: {docFile.name}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-800">
          Imágenes relacionadas (opcional)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) =>
            setImageFiles(Array.from(event.target.files ?? []))
          }
          className="block w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
        />
        {imageFiles.length > 0 && (
          <ul className="space-y-1 text-xs text-slate-600">
            {imageFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      {metadataError && (
        <p className="text-sm text-rose-600">{metadataError}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <MultiSelect
          label="Autores"
          options={metadata.authors}
          selected={authors}
          onChange={setAuthors}
          disabled={metadataLoading}
        />
        <MultiSelect
          label="Categorías"
          options={metadata.categories}
          selected={categories}
          onChange={setCategories}
          disabled={metadataLoading}
        />
        <MultiSelect
          label="Etiquetas"
          options={metadata.tags}
          selected={tags}
          onChange={setTags}
          disabled={metadataLoading}
        />
        <MultiSelect
          label="Organizaciones"
          options={metadata.organizations}
          selected={organizations}
          onChange={setOrganizations}
          disabled={metadataLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitStatus === "pending"}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitStatus === "pending" ? "Enviando..." : "Enviar"}
        </button>
        {submitStatus === "error" && submitMessage && (
          <span className="text-sm text-rose-600">{submitMessage}</span>
        )}
        {submitStatus === "success" && submitMessage && (
          <span className="text-sm text-emerald-600">{submitMessage}</span>
        )}
      </div>
    </form>
  );
}
