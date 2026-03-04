import UploadForm from "./UploadForm";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Subir artículo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Carga un documento y completa los metadatos asociados.
        </p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <UploadForm />
        </div>
      </div>
    </main>
  );
}
