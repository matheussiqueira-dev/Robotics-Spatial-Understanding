import {useAtom} from 'jotai';
import React from 'react';
import {Content} from './Content';
import {DetectTypeSelector} from './DetectTypeSelector';
import {ExampleImages} from './ExampleImages';
import {ExtraModeControls} from './ExtraModeControls';
import {Prompt} from './Prompt';
import {SideControls} from './SideControls';
import {TopBar} from './TopBar';
import {RequestJsonAtom, ResponseJsonAtom} from './atoms';

function JsonDisplay() {
  const [requestJson] = useAtom(RequestJsonAtom);
  const [responseJson] = useAtom(ResponseJsonAtom);

  return (
    <aside className="panel inspector-panel">
      <div className="inspector-section">
        <h2>API Request</h2>
        <pre aria-live="polite">
          <code>
            {requestJson ||
              'Execute uma analise para visualizar aqui o contrato enviado para a API.'}
          </code>
        </pre>
      </div>

      <div className="inspector-section">
        <h2>API Response</h2>
        <pre aria-live="polite">
          <code>
            {responseJson ||
              'A resposta detalhada da API aparecera aqui apos a primeira execucao.'}
          </code>
        </pre>
      </div>
    </aside>
  );
}

function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">
        <section className="workspace-column">
          <Content />
          <ExtraModeControls />
        </section>

        <section className="control-column">
          <SideControls />
          <ExampleImages />
          <DetectTypeSelector />
          <Prompt />
        </section>

        <JsonDisplay />
      </main>
    </div>
  );
}

export default App;