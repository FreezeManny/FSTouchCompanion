const testValue = "ToLiSs A321 Hi Def";
const testAircraftData = [
    {
      name: "Cessna Skyhawk",
      data: {
        com1: {
          dataRef: {
            standby: "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833",
            active: "sim/cockpit2/radios/actuators/com1_frequency_hz_833",
          },
          command: {
            switch: "sim/GPS/g430n1_com_ff",
          },
        },
        com2: {
          dataRef: {
            standby: "sim/cockpit2/radios/actuators/com2_standby_frequency_hz_833",
            active: "sim/cockpit2/radios/actuators/com2_frequency_hz_833",
          },
          command: {
            switch: "sim/GPS/g430n2_com_ff",
          },
        },
      },
    },
    {
      name: "ToLiSs A321 Hi Def",
      data: {
        com1: {
          dataRef: {
            standby: "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833",
            active: "sim/cockpit2/radios/actuators/com1_frequency_hz_833",
          },
          command: {
            switch: "AirbusFBW/RMPSwapCapt",
          },
        },
        com2: {
          dataRef: {
            standby: "sim/cockpit2/radios/actuators/com2_standby_frequency_hz_833",
            active: "sim/cockpit2/radios/actuators/com2_frequency_hz_833",
          },
          command: {
            switch: "AirbusFBW/RMPSwapCo",
          },
        },
      },
    },
  ];

testAircraftData.forEach((aircraft) => {
  console.log("Comparing:", aircraft.name, "with", testValue);
  if (aircraft.name === testValue) {
    console.log("Aircraft found:", aircraft.data);
  }
});