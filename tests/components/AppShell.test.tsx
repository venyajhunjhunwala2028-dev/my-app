import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader, AppPage, BackLink, Label, PageIntro, RowContent } from "@/components/app/AppShell";
import { STORAGE_KEY } from "@/lib/store/localStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => localStorage.setItem(STORAGE_KEY, "{}"));

describe("AppHeader", () => {
  it("shows the wordmark linking to the start page and a plain Settings control", () => {
    render(<AppHeader />);
    const header = screen.getByTestId("app-header");
    const home = within(header).getByRole("link", { name: "Tech Helper" });
    expect(home).toHaveAttribute("href", "/");
    expect(within(home).getByTestId("wordmark")).toBeInTheDocument();
    const settings = within(header).getByRole("button", { name: "Settings" });
    expect(settings).toHaveAttribute("aria-expanded", "false");
    expect(settings).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("can leave Settings out", () => {
    render(<AppHeader settings={false} />);
    expect(screen.queryByRole("button", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("opens Settings as a full-screen sheet; Close, Done and Escape shut it and focus goes back", async () => {
    render(<AppHeader />);
    const settings = screen.getByRole("button", { name: "Settings" });

    await userEvent.click(settings);
    const sheet = screen.getByRole("dialog", { name: "Settings" });
    expect(sheet).toHaveAttribute("aria-modal", "true");
    expect(within(sheet).getByRole("heading", { name: "Settings" })).toHaveFocus();
    expect(settings).toHaveAttribute("aria-expanded", "true");
    // Editorial sections, one per setting.
    for (const name of ["Easy Mode", "Language", "Text size"]) {
      expect(within(sheet).getByRole("group", { name })).toBeInTheDocument();
    }
    await userEvent.click(within(sheet).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(settings).toHaveFocus();

    await userEvent.click(settings);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(settings);
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("App shell parts", () => {
  it("BackLink is named by its words only, as a link or a button", async () => {
    const onClick = vi.fn();
    render(
      <>
        <BackLink href="/app">Back to home</BackLink>
        <BackLink onClick={onClick}>All practice</BackLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    await userEvent.click(screen.getByRole("button", { name: "All practice" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("Label shows (brackets) that screen readers skip", () => {
    render(<Label>Step 2 of 5</Label>);
    const label = screen.getByText("Step 2 of 5");
    expect(label).toHaveTextContent("(Step 2 of 5)");
    for (const bracket of label.querySelectorAll("span")) expect(bracket).toHaveAttribute("aria-hidden", "true");
  });

  it("AppPage puts the header above one main with the back link and a page intro", () => {
    render(
      <AppPage back={<BackLink href="/app">Back to home</BackLink>}>
        <PageIntro label="Safety" title="Is this a scam?" lead="Send it to me." />
      </AppPage>,
    );
    const main = screen.getByRole("main");
    expect(screen.getByTestId("app-header")).not.toContainElement(main);
    expect(within(main).getByRole("link", { name: "Back to home" })).toBeInTheDocument();
    expect(within(main).getByRole("heading", { level: 1, name: "Is this a scam?" })).toBeInTheDocument();
    expect(within(main).getByText("Safety")).toHaveTextContent("(Safety)");
  });

  it("RowContent keeps the icon and arrow out of the row's name", () => {
    render(
      <button type="button" aria-labelledby="t" aria-describedby="d">
        <RowContent icon="📚" title="Help library" desc="Common questions" titleId="t" descId="d" />
      </button>,
    );
    expect(screen.getByRole("button", { name: "Help library" })).toHaveAccessibleDescription("Common questions");
    expect(screen.getByText("📚")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("→")).toHaveAttribute("aria-hidden", "true");
  });
});
