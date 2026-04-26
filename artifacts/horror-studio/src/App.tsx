import AIImageGenerator from "./pages/AIImageGenerator";
import LocalGenerator from "./pages/LocalGenerator";
import OllamaChat from "./pages/OllamaChat";
import VoiceGenerator from "./pages/VoiceGenerator";
import PinokioLauncher from "./pages/PinokioLauncher";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CharacterTransformer from "@/pages/CharacterTransformer";
import TextAnimator from "@/pages/TextAnimator";
import StreamAlerts from "@/pages/StreamAlerts";
import ImageEditor from "@/pages/ImageEditor";
import Overlay from "@/pages/Overlay";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/overlay/:streamId" component={Overlay} />
      <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/character-transformer" component={() => <Layout><CharacterTransformer /></Layout>} />
      <Route path="/text-animator" component={() => <Layout><TextAnimator /></Layout>} />
      <Route path="/stream-alerts" component={() => <Layout><StreamAlerts /></Layout>} />
      <Route path="/image-editor" component={() => <Layout><ImageEditor /></Layout>} />
      <Route path="/image-generator" component={() => <Layout><AIImageGenerator /></Layout>} />
      <Route path="/local-generator" component={() => <Layout><LocalGenerator /></Layout>} />
      <Route path="/ollama-chat" component={() => <Layout><OllamaChat /></Layout>} />
      <Route path="/voice-generator" component={() => <Layout><VoiceGenerator /></Layout>} />
      <Route path="/pinokio" component={() => <Layout><PinokioLauncher /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

