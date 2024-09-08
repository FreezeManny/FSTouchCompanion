export async function sendCommand(commandPrefix) {
  try {
    let data = {
      command: commandPrefix,
    };

    const response = await fetch("/xpConnect", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
  } catch (error) {
    console.error("Error sending data:", error);
    throw error;
  }
}

export async function sendDataRef(dataRefPrefix, value) {
  try {
    let data = {
      dataRef: {
        dataRefPrefix: dataRefPrefix,
        value: value,
      },
    };
    console.log(data);

    const response = await fetch("/xpConnect", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

  } catch (error) {
    console.error("Error sending data:", error);
    throw error;
  }
}
