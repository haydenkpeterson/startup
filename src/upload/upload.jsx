import React from 'react';

export function Upload() {
  return (
    <main>
      <h2>Upload Your Financial Files</h2>
      <p>Submit your files for AI-powered auditing and analysis.</p>

      <form action="/api/openai" method="post" enctype="multipart/form-data">
        <label for="file"><strong>Select a file:</strong></label>
        <input type="file" id="file" name="file" required />
        <button type="submit">Process with AI</button>
      </form>

      <p><em>(Files will be processed on the backend via the OpenAI API.)</em></p>

      <section>
        <h2>Realtime Updates (Placeholder)</h2>
        <div className="realtime-updates">Awaiting backend connection...</div>
      </section>
    </main>
  );
}