export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-8 h-8 border-2 border-eq-border border-t-eq-accent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-eq-danger/10 border border-eq-danger/40 text-eq-danger rounded px-4 py-3 text-sm">
      {message}
    </div>
  );
}
