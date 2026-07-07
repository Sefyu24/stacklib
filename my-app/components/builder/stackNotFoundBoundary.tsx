"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches the error thrown by getStack (via useQuery) when a card is missing
 * or not owned by the signed-in user, and renders a friendly fallback instead
 * of crashing the route. The builder query enforces ownership server-side, so
 * any thrown error here means "you can't open this card."
 */
export default class StackNotFoundBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Error opening card:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
