import { useState } from 'react';

export default function RegexInput({ onGenerate }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onGenerate(value);
    }
  };

  const examples = ['ab*', 'a*b', '(a|b)*ab', 'a|b'];

  const handleExampleClick = (example) => {
    setValue(example);
    onGenerate(example);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <label
          htmlFor="regex-input"
          className="text-sm font-medium text-muted-foreground whitespace-nowrap"
        >
          Regex (a, b):
        </label>
        <input
          id="regex-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. (a|b)*ab"
          className="flex-1 px-4 py-2.5 text-sm font-mono rounded-lg border-2 border-border bg-card text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
        >
          Generate
        </button>
      </form>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Quick examples:</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleExampleClick(example)}
            className="px-2.5 py-1 text-xs font-mono rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
