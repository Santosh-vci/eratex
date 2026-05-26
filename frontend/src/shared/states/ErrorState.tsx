export function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="border border-red-200 bg-red-50 p-5">
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}
