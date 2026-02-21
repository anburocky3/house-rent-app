export default function AppFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white/80 px-4 py-2 text-center text-[11px] font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
      Crafted with &#10084;&#65039; by{" "}
      <a
        href="https://anbuselvan-annamalai.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-orange-500"
      >
        Anbuselvan Annamalai
      </a>{" "}
      <span className="mx-1">|</span>
      &copy; {new Date().getFullYear()}
    </footer>
  );
}
