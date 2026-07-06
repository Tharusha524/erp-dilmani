export function getPageMetaFromPath(pathname: string): { title: string; breadcrumb: string } {
  if (pathname === "/" || pathname === "/dashboard" || pathname === "/home") {
    return { title: "Dashboard", breadcrumb: "Home / Dashboard" };
  }

  const segments = pathname.split("/").filter(Boolean);
  const formatted = segments.map((segment) =>
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );

  return {
    title: formatted[formatted.length - 1] || "Dashboard",
    breadcrumb: ["Home", ...formatted].join(" / "),
  };
}
