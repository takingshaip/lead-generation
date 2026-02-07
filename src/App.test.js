import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders sign in screen by default", () => {
  render(<App />);
  const heading = screen.getByText(/sign in/i);
  expect(heading).toBeInTheDocument();
});
