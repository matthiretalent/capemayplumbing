const MAKE_WEBHOOK_URL = "https://hook.us2.make.com/ofliu6bt1urt53gj2ok46mbyeravl59i";

exports.handler = async function (event) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Only forward call_ended events (when call_analysis is available)
  if (payload.event !== "call_ended") {
    return { statusCode: 200, body: "Ignored" };
  }

  const call = payload.call || {};
  const analysis = call.call_analysis || {};
  const customData = analysis.custom_analysis_data || {};

  const makePayload = {
    call_id: call.call_id,
    call_status: call.call_status,
    start_timestamp: call.start_timestamp,
    end_timestamp: call.end_timestamp,
    duration_ms: call.end_timestamp && call.start_timestamp
      ? call.end_timestamp - call.start_timestamp
      : null,
    call_summary: analysis.call_summary,
    customer_name: customData.customer_name,
    service_address: customData.service_address,
    service_needed: customData.service_needed,
    phone_number: call.from_number || customData.phone_number,
    raw_call_analysis: analysis,
  };

  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(makePayload),
    });

    if (!response.ok) {
      throw new Error("Make.com responded with status " + response.status);
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
