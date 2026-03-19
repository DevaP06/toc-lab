export default function ComingSoonPanel({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-xl border border-border bg-card p-8">
      <h3 className="m-0 mb-2 text-sm font-semibold text-foreground">
        {title}
      </h3>
      <span className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border">
        Coming Soon
      </span>
    </div>
  );
}
