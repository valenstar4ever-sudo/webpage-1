const SYSTEM_PROMPT = `Eres el guía de aventuras del portfolio de Aboubakre Azzabi. Responde en español, con calidez, claridad y un toque de diario de exploración; evita exagerar o alargar las respuestas.
Datos confirmados: Aboubakre estudia primer curso de Desarrollo de Aplicaciones Multiplataforma (DAM) en el IES Simarro; tiene más de ocho años de experiencia en una tienda de videojuegos; ha ayudado a clientes, resuelto problemas de software y reparado dispositivos, consolas y mandos. Quiere aprender programación y desarrollar software. Sus intereses incluyen videojuegos, programación, ciclismo, patinaje, camping, senderismo y mejorar su español. Su juego favorito es Ghost of Tsushima. La zona de senderismo que le interesa es Valencia, España.
Ayuda con preguntas sobre senderismo y preparación de excursiones, gaming, Ghost of Tsushima, camping responsable y práctica del español. Para ideas de senderismo puedes mencionar lugares conocidos de Valencia como la Sierra Calderona, Chulilla o l'Albufera, sin afirmar condiciones actuales del recorrido. No des por hecho que se permite acampar en un paraje concreto: dirige a la normativa y fuentes oficiales locales. No afirmes datos actuales sobre cierres, permisos, clima, transporte o seguridad; anima a verificar fuentes oficiales antes de salir. Para español, ofrece frases útiles, práctica amable y correcciones breves. No inventes datos personales, experiencia profesional, credenciales ni preferencias no indicadas. Si no sabes algo, dilo claramente. No solicites datos sensibles.`;

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

function respond(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Método no permitido." });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not configured.");
    return respond(503, { error: "El asistente aún no está configurado." });
  }

  if (!event.body || event.body.length > 14000) {
    return respond(413, { error: "La solicitud es demasiado larga." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return respond(400, { error: "Solicitud JSON no válida." });
  }

  const messages = payload && payload.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 10) {
    return respond(400, { error: "La conversación no es válida." });
  }

  const validMessages = messages.every(message =>
    message &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 1000
  );

  if (!validMessages || messages[messages.length - 1].role !== "user") {
    return respond(400, { error: "La conversación no es válida." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 350,
        temperature: 0.5
      })
    });

    if (!apiResponse.ok) {
      console.error(`OpenAI request failed with status ${apiResponse.status}.`);
      return respond(502, { error: "El proveedor de respuestas no está disponible." });
    }

    const result = await apiResponse.json();
    const reply = result.choices && result.choices[0] &&
      result.choices[0].message && result.choices[0].message.content;

    if (typeof reply !== "string" || !reply.trim()) {
      console.error("OpenAI returned an empty or invalid response.");
      return respond(502, { error: "El proveedor devolvió una respuesta no válida." });
    }

    return respond(200, { reply: reply.trim() });
  } catch (error) {
    console.error(error.name === "AbortError" ? "OpenAI request timed out." : "OpenAI request failed.");
    return respond(502, { error: "No se pudo contactar con el proveedor de respuestas." });
  } finally {
    clearTimeout(timeout);
  }
};
