import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/stands")({
  component: StandsLayout,
});

function StandsLayout() {
  return <Outlet />;
}
