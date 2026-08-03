import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalculatedValue, RadarStatusBadge } from "../components/ui";

describe("shared UI contracts", () => {
  it("renders calculated values as read-only display data", () => {
    render(<CalculatedValue label="Caixa atual" value={1200} recalculatedAt="2026-07-21T12:00:00Z" origin="ind_painel.caixa_atual" />);

    expect(screen.getByText("Caixa atual")).toBeTruthy();
    expect(screen.getByText("R$ 1.200,00")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("shows unsupported tribunals as neutral pending implementation state", () => {
    render(<RadarStatusBadge status="pendente_implementacao" />);

    const badge = screen.getByText("Aguardando scraper");
    expect(badge).toBeTruthy();
    expect(badge.closest(".status-badge")?.className).toContain("pending");
  });
});
