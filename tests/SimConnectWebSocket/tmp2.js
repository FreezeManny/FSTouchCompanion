var ExtPlaneJs = require("extplanejs");
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
var functions = require("./functions");

var aircraft = "ZiboB738"; //ZiboB738, iniBuildsA300, FFB767




var mcpCOMPort = "COM7";
var mcpSerialPort = new SerialPort({path: mcpCOMPort, baudRate: 115200});

const mcpParser = mcpSerialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

var arduinoStarted = false;
var firstSend = false;

var simOutputMap = {
    "Left_Course": {
        "name": "LCrs",
        "dref": "", 
        "val": "   "
    },
    "IAS_Mach": {
        "name": "IASM",
        "dref": "", 
        "val": "   "
    },
    "Heading": {
        "name": "Hdg",
        "dref": "", 
        "val": "   "
    },
    "Altitude": {
        "name": "Alt",
        "dref": "", 
        "val": "     "
    },
    "Vertical_Speed": {
        "name": "VS",
        "dref": "", 
        "val": "     "
    },
    "Right_Course": {
        "name": "RCrs",
        "dref": "", 
        "val": "   "
    },
    "VNAV": {
        "name": "VNAV",
        "dref": "", 
        "val": "0"
    },
    "LNAV": {
        "name": "LNAV",
        "dref": "", 
        "val": "0"
    },
    "VOR_LOC": {
        "name": "VOR",
        "dref": "", 
        "val": "0"
    },
    "CMD_A": {
        "name": "CMDA",
        "dref": "", 
        "val": "0"
    },
    "CMD_B": {
        "name": "CMDB",
        "dref": "", 
        "val": "0"
    },
    "N1": {
        "name": "N1",
        "dref": "", 
        "val": "0"
    },
    "Speed": {
        "name": "Spd",
        "dref": "", 
        "val": "0"
    },
    "LVL_CHG": {
        "name": "LVL",
        "dref": "", 
        "val": "0"
    },
    "HDG_SEL": {
        "name": "HDGS",
        "dref": "", 
        "val": "0"
    },
    "APP": {
        "name": "APP",
        "dref": "", 
        "val": "0"
    },
    "ALT_HLD": {
        "name": "ALTH",
        "dref": "", 
        "val": "0"
    },
    "V_S": {
        "name": "VSS",
        "dref": "", 
        "val": "0"
    },
    "CWS_A": {
        "name": "CWSA",
        "dref": "", 
        "val": "0"
    },
    "CWS_B": {
        "name": "CWSB",
        "dref": "", 
        "val": "0"
    },
    "MA_LEFT": {
        "name": "MAL",
        "dref": "", 
        "val": "0"
    },
    "AT_ON": {
        "name": "AT",
        "dref": "", 
        "val": "0"
    },
    "MA_RIGHT": {
        "name": "MAR",
        "dref": "", 
        "val": "0"
    }
}

var simInputMap = {
    "FD_LEFT": {
        "type": "",
        "cmd": "",
    },
    "AT_ARM": {
        "type": "",
        "cmd": "",
    },
    "FD_RIGHT": {
        "type": "",
        "cmd": "",
    },
    "Bank_Selector_Pos": {
        "type": "",
        "cmd": "",
    },
    "Left_Course_Up": {
        "type": "",
        "cmd": "",
    },
    "Left_Course_Down": {
        "type": "",
        "cmd": "",
    },
    "IAS_Mach_Up": {
        "type": "",
        "cmd": "",
    },
    "IAS_Mach_Down": {
        "type": "",
        "cmd": "",
    },
    "Heading_Up": {
        "type": "",
        "cmd": "",
    },
    "Heading_Down": {
        "type": "",
        "cmd": "",
    },
    "Altitude_Up": {
        "type": "",
        "cmd": "",
    },
    "Altitude_Down": {
        "type": "",
        "cmd": "",
    },
    "Vertical_Speed_Up": {
        "type": "",
        "cmd": "",
    },
    "Vertical_Speed_Down": {
        "type": "",
        "cmd": "",
    },
    "Right_Course_Up": {
        "type": "",
        "cmd": "",
    },
    "Right_Course_Down": {
        "type": "",
        "cmd": "",
    },
    "VNAV": {
        "type": "",
        "cmd": "",
    },
    "LNAV": {
        "type": "",
        "cmd": "",
    },
    "VOR_LOC": {
        "type": "",
        "cmd": "",
    },
    "CMD_A": {
        "type": "",
        "cmd": "",
    },
    "CMD_B": {
        "type": "",
        "cmd": "",
    },
    "N1": {
        "type": "",
        "cmd": "",
    },
    "Speed": {
        "type": "",
        "cmd": "",
    },
    "LVL_CHG": {
        "type": "",
        "cmd": "",
    },
    "HDG_SEL": {
        "type": "",
        "cmd": "",
    },
    "APP": {
        "type": "",
        "cmd": "",
    },
    "ALT_HLD": {
        "type": "",
        "cmd": "",
    },
    "V_S": {
        "type": "",
        "cmd": "",
    },
    "CWS_A": {
        "type": "",
        "cmd": "",
    },
    "CWS_B": {
        "type": "",
        "cmd": "",
    },
    "AP_DISENGAGE": {
        "type": "",
        "cmd": "",
    },
    "CO": {
        "type": "",
        "cmd": "",
    },
    "SPD_INTV": {
        "type": "",
        "cmd": "",
    },
    "ALT_INTV": {
        "type": "",
        "cmd": "",
    },
}



//Creates Connection to XP11
var ExtPlane = new ExtPlaneJs({
    host: "127.0.0.1",
    port: 51000,
    broadcast: true,
});

//Runs, when ExtPlane loaded
ExtPlane.on("loaded", function () {
    ExtPlane.client.interval(0.01);

    console.log("");
    console.log("--- EXTPLANE LOADED ---");
    console.log("");
    console.log("selected: " + aircraft);
    console.log("");

    //Reads the Output Config
    functions.readConfig("./airplaneConfig/" + aircraft + "Output.txt").forEach(element => {
        //ExtPlane.client.subscribe(element);
        var parts = element.split(":");
        simOutputMap[parts[0]].dref = parts[1];
        if (parts[1] != "x"){
            ExtPlane.client.subscribe(parts[1]);
        }
    });

    //Read the Input Config
    functions.readConfig("./airplaneConfig/" + aircraft + "Input.txt").forEach(element => {
        var parts = element.split(":");        
        simInputMap[parts[0]].type = parts[1];
        simInputMap[parts[0]].cmd = parts[2];
        //register Drefs for Toggles and Rotary Switchs. The other ones are only Commands
        for(const key in simInputMap) {
            if(simInputMap[key].type == "Toggle" || simInputMap[key].type == "RotarySwitch"){
                if (simInputMap[key].cmd != "x"){
                    ExtPlane.client.subscribe(simInputMap[key].cmd);
                }
            }
        }
        
        
    });

    
    // Handle all data-ref changes
    ExtPlane.on("data-ref", function (data_ref, value) {
        //console.log(data_ref," ",value);

        
        if (aircraft == "ZiboB738"){
            //Config for B738
            switch (data_ref) {
                case simOutputMap.Left_Course.dref:
                    //if the changed Dataref is the Left Course it fill it to 3 Digits
                    simOutputMap.Left_Course.val = functions.pad(value, 3, "0");
                    //console.log(simOutputMap.Left_Course);
                    break;
                case simOutputMap.IAS_Mach.dref:
                    //check if VNAV is non. If it is, the display is not on
                    if (simOutputMap.VNAV.val == "0"){
                        //checks if Plane is in speed or mach mode
                        if (value > 1){
                            //Speed mode
                            simOutputMap.IAS_Mach.val = functions.pad(Math.round(value), 3, "0");
                        }
                        else{
                            // Mach mode
                            value = "" + (Math.round(value * 100)/100); //round Mach to 2 digits as it comes in a long float
                            value = value.substring(1, value.length) //Cuts the first 0 away, as display starts with .
                            //fill back to 3 Variables
                            simOutputMap.IAS_Mach.val = functions.padBack(value, 3, "0") //fills it to 3 Digits again
                        }
                    }
                    else {
                        simOutputMap.IAS_Mach.val = "   ";
                    }
                        //console.log(simOutputMap.IAS_Mach);
                    break;
                case simOutputMap.Heading.dref:
                    //if the changed Dataref is the Heading it fill it to 3 Digits
                    simOutputMap.Heading.val = functions.pad(value, 3, "0");
                    //console.log(simOutputMap.Heading);
                    break;
                case simOutputMap.Altitude.dref:
                    simOutputMap.Altitude.val = functions.pad(value, 5, " ")
                    //console.log(simOutputMap.Altitude)
                    break;
                case simOutputMap.Vertical_Speed.dref:
                    //check if Vertical Speed mode is active. It will only send it, when it is active.
                    if (simOutputMap.V_S.val == "1"){
                        value = "" + value;
                        
                        if (value == "0"){
                            simOutputMap.Vertical_Speed.val = "00000";
                        }
                        else if (value < 0){
                            value = value.substring(1, value.length);
                            value = functions.pad(value, 4, " ");
                            simOutputMap.Vertical_Speed.val = "-" + value;
                        }
                        else{
                            simOutputMap.Vertical_Speed.val = functions.pad(value, 5, " ");
                        }
                    }
                    else {
                        simOutputMap.Vertical_Speed.val = "     ";
                    }
                    //console.log(simOutputMap.Vertical_Speed);
                    break;
                case simOutputMap.Right_Course.dref:
                    simOutputMap.Right_Course.val = functions.pad(value, 3, "0");
                    break;

                default:
                    for(const key in simOutputMap) { //goes through all Drefs
                        if(simOutputMap[key].dref == data_ref) {//This gets all the LED Pins
                            simOutputMap[key].val = value;
                            //console.log(simOutputMap[key].dref, simOutputMap[key].val);
                            //break; //der performance wegen ein break, dann sucht er nach dem Fund nicht weiter.
                        }
                    }
                break;
            }        
            
            if (arduinoStarted == true){
                for(const key in simOutputMap) { //goes through all Drefs
                    if(simOutputMap[key].dref == data_ref) {//This gets all the LED Pins
                        //console.log(simOutputMap[key].name + ":" + simOutputMap[key].val + ";");
                        mcpSerialPort.write(simOutputMap[key].name + ":" + simOutputMap[key].val + ";");
                        break; //der performance wegen ein break, dann sucht er nach dem Fund nicht weiter.
                    }
                }
            }
        
            if (firstSend == true){
                mcpSerialPort.write(simOutputMap.Left_Course.name + ":" + simOutputMap.Left_Course.val + ";");
                mcpSerialPort.write(simOutputMap.IAS_Mach.name + ":" + simOutputMap.IAS_Mach.val + ";");
                mcpSerialPort.write(simOutputMap.Heading.name + ":" + simOutputMap.Heading.val + ";");
                mcpSerialPort.write(simOutputMap.Altitude.name + ":" + simOutputMap.Altitude.val + ";");
                mcpSerialPort.write(simOutputMap.Vertical_Speed.name + ":" + simOutputMap.Vertical_Speed.val + ";");
                mcpSerialPort.write(simOutputMap.Right_Course.name + ":" + simOutputMap.Right_Course.val + ";");            
                firstSend = false;
            }

        }
        else if (aircraft == "iniBuildsA300"){
            //Config for A300
            switch (data_ref) {
                
                case simOutputMap.IAS_Mach.dref:
                    //check if VNAV is non. If it is, the display is not on
                    if (simOutputMap.VNAV.val == "0"){
                        //checks if Plane is in speed or mach mode
                        if (value > 1){
                            //Speed mode
                            simOutputMap.IAS_Mach.val = functions.pad(Math.round(value), 3, "0");
                        }
                        else{
                            // Mach mode
                            value = "" + (Math.round(value * 100)/100); //round Mach to 2 digits as it comes in a long float
                            value = value.substring(1, value.length) //Cuts the first 0 away, as display starts with .
                            //fill back to 3 Variables
                            simOutputMap.IAS_Mach.val = functions.padBack(value, 3, "0") //fills it to 3 Digits again
                        }
                    }
                    else {
                        simOutputMap.IAS_Mach.val = "   ";
                    }
                        //console.log(simOutputMap.IAS_Mach);
                    break;
                case simOutputMap.Heading.dref:
                    //if the changed Dataref is the Heading it fill it to 3 Digits
                    value = "" + (Math.round(value));
                    simOutputMap.Heading.val = functions.pad(value, 3, "0");
                    //console.log(simOutputMap.Heading);
                    break;
                case simOutputMap.Altitude.dref:
                    simOutputMap.Altitude.val = functions.pad(value, 5, " ")
                    //console.log(simOutputMap.Altitude)
                    break;

                

                case simOutputMap.Vertical_Speed.dref:
                    //check if Vertical Speed mode is active. It will only send it, when it is active.
                    value = "" + value;
                    if (value == "0") {
                        simOutputMap.Vertical_Speed.val = "    "
                    }
                    if (value < 0){
                        value = value.substring(1, value.length);
                        value = functions.pad(value, 4, " ");
                        simOutputMap.Vertical_Speed.val = "-" + value;
                    }
                    else{
                        simOutputMap.Vertical_Speed.val = functions.pad(value, 5, " ");
                    }
                    //console.log(simOutputMap.Vertical_Speed);
                    
                    break;
                default:
                    for(const key in simOutputMap) { //goes through all Drefs
                        if(simOutputMap[key].dref == data_ref) {//This gets all the LED Pins
                            simOutputMap[key].val = value;
                            //console.log(simOutputMap[key].dref, simOutputMap[key].val);
                            //break; //der performance wegen ein break, dann sucht er nach dem Fund nicht weiter.
                        }
                    }
                break;
            }                    
            
            if (arduinoStarted == true){
                for(const key in simOutputMap) { //goes through all Drefs
                    if(simOutputMap[key].dref == data_ref) {//This gets all the LED Pins
                        //console.log(simOutputMap[key].name + ":" + simOutputMap[key].val + ";");
                        mcpSerialPort.write(simOutputMap[key].name + ":" + simOutputMap[key].val + ";");
                        break; //der performance wegen ein break, dann sucht er nach dem Fund nicht weiter.
                    }
                }
            }
        
            if (firstSend == true){
                mcpSerialPort.write(simOutputMap.Left_Course.name + ":" + simOutputMap.Left_Course.val + ";");
                mcpSerialPort.write(simOutputMap.IAS_Mach.name + ":" + simOutputMap.IAS_Mach.val + ";");
                mcpSerialPort.write(simOutputMap.Heading.name + ":" + simOutputMap.Heading.val + ";");
                mcpSerialPort.write(simOutputMap.Altitude.name + ":" + simOutputMap.Altitude.val + ";");
                mcpSerialPort.write(simOutputMap.Vertical_Speed.name + ":" + simOutputMap.Vertical_Speed.val + ";");
                mcpSerialPort.write(simOutputMap.Right_Course.name + ":" + simOutputMap.Right_Course.val + ";");            
                firstSend = false;
            }

        } 
        

    });

    mcpParser.on('data', function (receivedData){
        //console.log("Recieve: " + receivedData);
        if (receivedData == "start"){
            console.log("Start MCP");
            arduinoStarted = true;
            firstSend = true;
        }
        if (aircraft == "ZiboB738"){
            //Function for the Toggle Switches
            // Left Flight Director
            if (receivedData[0] == "0"){ 
                ExtPlane.client.set(simInputMap.FD_LEFT.cmd, '0');
            }
            else {
                ExtPlane.client.set(simInputMap.FD_LEFT.cmd, '1');
            }
            //Autothrottle Arm
            if (receivedData[1] == "0"){
                ExtPlane.client.set(simInputMap.AT_ARM.cmd, 0);
            }
            else {
                ExtPlane.client.set(simInputMap.AT_ARM.cmd, 1);
            }
            //Right Flight Director
            if (receivedData[2] == "0"){
                ExtPlane.client.set(simInputMap.FD_RIGHT.cmd, 0);
            }
            else {
                ExtPlane.client.set(simInputMap.FD_RIGHT.cmd, 1);
            }

            //Function for Bank Selector
            if (receivedData[3] == "0"){
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 0);
            }
            else if (receivedData[3] == "1") {
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 1);
            }
            else if (receivedData[3] == "2") {
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 2);
            }
            else if (receivedData[3] == "3") {
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 3);
            }
            else if (receivedData[3] == "4") {
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 4);
            }

            //Encoder Functions
            //Left Course Encoder
            if (receivedData[4] == "1"){
                ExtPlane.client.begin(simInputMap.Left_Course_Up.cmd);
                ExtPlane.client.end(simInputMap.Left_Course_Up.cmd);
            }
            else if (receivedData[4] == "2"){
                ExtPlane.client.begin(simInputMap.Left_Course_Down.cmd);
                ExtPlane.client.end(simInputMap.Left_Course_Down.cmd);
            }
            //IAS Mach Speed
            if (receivedData[5] == "1"){
                ExtPlane.client.begin(simInputMap.IAS_Mach_Up.cmd);
                ExtPlane.client.end(simInputMap.IAS_Mach_Up.cmd);
            }
            else if (receivedData[5] == "2"){
                ExtPlane.client.begin(simInputMap.IAS_Mach_Down.cmd);
                ExtPlane.client.end(simInputMap.IAS_Mach_Down.cmd);
            }
            //Heading
            if (receivedData[6] == "1"){
                ExtPlane.client.begin(simInputMap.Heading_Up.cmd);
                ExtPlane.client.end(simInputMap.Heading_Up.cmd);
            }
            else if (receivedData[6] == "2"){
                ExtPlane.client.begin(simInputMap.Heading_Down.cmd);
                ExtPlane.client.end(simInputMap.Heading_Down.cmd);
            }
            //Altitude
            if (receivedData[7] == "1"){
                ExtPlane.client.begin(simInputMap.Altitude_Up.cmd);
                ExtPlane.client.end(simInputMap.Altitude_Up.cmd);
            }
            else if (receivedData[7] == "2"){
                ExtPlane.client.begin(simInputMap.Altitude_Down.cmd);
                ExtPlane.client.end(simInputMap.Altitude_Down.cmd);
            }
            //Vertical Speed
            if (receivedData[8] == "1"){
                ExtPlane.client.begin(simInputMap.Vertical_Speed_Up.cmd);
                ExtPlane.client.end(simInputMap.Vertical_Speed_Up.cmd);
            }
            else if (receivedData[8] == "2"){
                ExtPlane.client.begin(simInputMap.Vertical_Speed_Down.cmd);
                ExtPlane.client.end(simInputMap.Vertical_Speed_Down.cmd);
            }
            //Right Course
            if (receivedData[9] == "1"){
                ExtPlane.client.begin(simInputMap.Right_Course_Up.cmd);
                ExtPlane.client.end(simInputMap.Right_Course_Up.cmd);
            }
            else if (receivedData[9] == "2"){
                ExtPlane.client.begin(simInputMap.Right_Course_Down.cmd);
                ExtPlane.client.end(simInputMap.Right_Course_Down.cmd);
            }

            //Switch Functions
            //VNAV
            if (receivedData[10] == "1"){
                ExtPlane.client.begin(simInputMap.VNAV.cmd);
                ExtPlane.client.end(simInputMap.VNAV.cmd);
            }
            //LNAV
            if (receivedData[11] == "1"){
                ExtPlane.client.begin(simInputMap.LNAV.cmd);
                ExtPlane.client.end(simInputMap.LNAV.cmd);
            }
            //VOR LOC
            if (receivedData[12] == "1"){
                ExtPlane.client.begin(simInputMap.VOR_LOC.cmd);
                ExtPlane.client.end(simInputMap.VOR_LOC.cmd);
            }
            //CMD A
            if (receivedData[13] == "1"){
                ExtPlane.client.begin(simInputMap.CMD_A.cmd);
                ExtPlane.client.end(simInputMap.CMD_A.cmd);
            }
            //CMD B
            if (receivedData[14] == "1"){
                ExtPlane.client.begin(simInputMap.CMD_B.cmd);
                ExtPlane.client.end(simInputMap.CMD_B.cmd);
            }
            //N1
            if (receivedData[15] == "1"){
                ExtPlane.client.begin(simInputMap.N1.cmd);
                ExtPlane.client.end(simInputMap.N1.cmd);
            }
            //Speed
            if (receivedData[16] == "1"){
                ExtPlane.client.begin(simInputMap.Speed.cmd);
                ExtPlane.client.end(simInputMap.Speed.cmd);
            }
            //LVL Change
            if (receivedData[17] == "1"){
                ExtPlane.client.begin(simInputMap.LVL_CHG.cmd);
                ExtPlane.client.end(simInputMap.LVL_CHG.cmd);
            }
            //Heading Select
            if (receivedData[18] == "1"){
                ExtPlane.client.begin(simInputMap.HDG_SEL.cmd);
                ExtPlane.client.end(simInputMap.HDG_SEL.cmd);
            }
            //APP
            if (receivedData[19] == "1"){
                ExtPlane.client.begin(simInputMap.APP.cmd);
                ExtPlane.client.end(simInputMap.APP.cmd);
            }
            //ALT-Hold
            if (receivedData[20] == "1"){
                ExtPlane.client.begin(simInputMap.ALT_HLD.cmd);
                ExtPlane.client.end(simInputMap.ALT_HLD.cmd);
            }
            //Vertical Speed
            if (receivedData[21] == "1"){
                ExtPlane.client.begin(simInputMap.V_S.cmd);
                ExtPlane.client.end(simInputMap.V_S.cmd);
            }
            //CWS A
            if (receivedData[22] == "1"){
                ExtPlane.client.begin(simInputMap.CWS_A.cmd);
                ExtPlane.client.end(simInputMap.CWS_A.cmd);
            }
            //CWS B
            if (receivedData[23] == "1"){
                ExtPlane.client.begin(simInputMap.CWS_B.cmd);
                ExtPlane.client.end(simInputMap.CWS_B.cmd);
            }
            //AP Dissengage
            if (receivedData[24] == "1"){
                ExtPlane.client.begin(simInputMap.AP_DISENGAGE.cmd);
                ExtPlane.client.end(simInputMap.AP_DISENGAGE.cmd);
            }
            //CO
            if (receivedData[25] == "1"){
                ExtPlane.client.begin(simInputMap.CO.cmd);
                ExtPlane.client.end(simInputMap.CO.cmd);
            }
            //SPD_INTV
            if (receivedData[26] == "1"){
                ExtPlane.client.begin(simInputMap.SPD_INTV.cmd);
                ExtPlane.client.end(simInputMap.SPD_INTV.cmd);
            }
            //ALT_INTV
            if (receivedData[27] == "1"){
                ExtPlane.client.begin(simInputMap.ALT_INTV.cmd);
                ExtPlane.client.end(simInputMap.ALT_INTV.cmd);
            }


            

        }

        else if (aircraft == "iniBuildsA300"){
            //Function for the Toggle Switches
            // Left Flight Director
            if (receivedData[0] == "0"){ 
                ExtPlane.client.set(simInputMap.FD_LEFT.cmd, '0');
            }
            else {
                ExtPlane.client.set(simInputMap.FD_LEFT.cmd, '0.5');
            }
            //Right Flight Director
            if (receivedData[2] == "0"){
                ExtPlane.client.set(simInputMap.FD_RIGHT.cmd, '0');
            }
            else {
                ExtPlane.client.set(simInputMap.FD_RIGHT.cmd, '0.5');
            }
            //Function for Bank Selector
            if (receivedData[3] == "3") {
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 3);
            }
            else if (receivedData[3] == "4") {
                ExtPlane.client.set(simInputMap.Bank_Selector_Pos.cmd, 4);
            }


            //Encoder Functions
            //Left Course Encoder
            if (receivedData[4] == "1"){
                ExtPlane.client.begin(simInputMap.Left_Course_Up.cmd);
                ExtPlane.client.end(simInputMap.Left_Course_Up.cmd);
            }
            else if (receivedData[4] == "2"){
                ExtPlane.client.begin(simInputMap.Left_Course_Down.cmd);
                ExtPlane.client.end(simInputMap.Left_Course_Down.cmd);
            }
            //IAS Mach Speed
            if (receivedData[5] == "1"){
                ExtPlane.client.begin(simInputMap.IAS_Mach_Up.cmd);
                ExtPlane.client.end(simInputMap.IAS_Mach_Up.cmd);
            }
            else if (receivedData[5] == "2"){
                ExtPlane.client.begin(simInputMap.IAS_Mach_Down.cmd);
                ExtPlane.client.end(simInputMap.IAS_Mach_Down.cmd);
            }
            //Heading
            if (receivedData[6] == "1"){
                ExtPlane.client.begin(simInputMap.Heading_Up.cmd);
                ExtPlane.client.end(simInputMap.Heading_Up.cmd);
            }
            else if (receivedData[6] == "2"){
                ExtPlane.client.begin(simInputMap.Heading_Down.cmd);
                ExtPlane.client.end(simInputMap.Heading_Down.cmd);
            }
            //Altitude
            if (receivedData[7] == "1"){
                ExtPlane.client.begin(simInputMap.Altitude_Up.cmd);
                ExtPlane.client.end(simInputMap.Altitude_Up.cmd);
            }
            else if (receivedData[7] == "2"){
                ExtPlane.client.begin(simInputMap.Altitude_Down.cmd);
                ExtPlane.client.end(simInputMap.Altitude_Down.cmd);
            }
            //Vertical Speed
            if (receivedData[8] == "1"){
                ExtPlane.client.begin(simInputMap.Vertical_Speed_Up.cmd);
                ExtPlane.client.end(simInputMap.Vertical_Speed_Up.cmd);
            }
            else if (receivedData[8] == "2"){
                ExtPlane.client.begin(simInputMap.Vertical_Speed_Down.cmd);
                ExtPlane.client.end(simInputMap.Vertical_Speed_Down.cmd);
            }
            //Right Course
            if (receivedData[9] == "1"){
                ExtPlane.client.begin(simInputMap.Right_Course_Up.cmd);
                ExtPlane.client.end(simInputMap.Right_Course_Up.cmd);
            }
            else if (receivedData[9] == "2"){
                ExtPlane.client.begin(simInputMap.Right_Course_Down.cmd);
                ExtPlane.client.end(simInputMap.Right_Course_Down.cmd);
            }

            //Switch Functions
            //VNAV
            if (receivedData[10] == "1"){
                ExtPlane.client.begin(simInputMap.VNAV.cmd);
                ExtPlane.client.end(simInputMap.VNAV.cmd);
            }
            //LNAV
            if (receivedData[11] == "1"){
                ExtPlane.client.begin(simInputMap.LNAV.cmd);
                ExtPlane.client.end(simInputMap.LNAV.cmd);
            }
            //VOR LOC
            if (receivedData[12] == "1"){
                ExtPlane.client.begin(simInputMap.VOR_LOC.cmd);
                ExtPlane.client.end(simInputMap.VOR_LOC.cmd);
            }
            //CMD A
            if (receivedData[13] == "1"){
                ExtPlane.client.begin(simInputMap.CMD_A.cmd);
                ExtPlane.client.end(simInputMap.CMD_A.cmd);
            }
            //CMD B
            if (receivedData[14] == "1"){
                ExtPlane.client.begin(simInputMap.CMD_B.cmd);
                ExtPlane.client.end(simInputMap.CMD_B.cmd);
            }
            //Speed
            if (receivedData[16] == "1"){
                ExtPlane.client.begin(simInputMap.Speed.cmd);
                ExtPlane.client.end(simInputMap.Speed.cmd);
            }
            //LVL Change
            if (receivedData[17] == "1"){
                ExtPlane.client.begin(simInputMap.LVL_CHG.cmd);
                ExtPlane.client.end(simInputMap.LVL_CHG.cmd);
            }
            //Heading Select
            if (receivedData[18] == "1"){
                ExtPlane.client.begin(simInputMap.HDG_SEL.cmd);
                ExtPlane.client.end(simInputMap.HDG_SEL.cmd);
            }
            //APP
            if (receivedData[19] == "1"){
                ExtPlane.client.begin(simInputMap.APP.cmd);
                ExtPlane.client.end(simInputMap.APP.cmd);
            }
            //Vertical Speed
            if (receivedData[21] == "1"){
                ExtPlane.client.begin(simInputMap.V_S.cmd);
                ExtPlane.client.end(simInputMap.V_S.cmd);
            }
            //CWS A
            if (receivedData[22] == "1"){
                ExtPlane.client.begin(simInputMap.CWS_A.cmd);
                ExtPlane.client.end(simInputMap.CWS_A.cmd);
            }
            //AP Dissengage
            if (receivedData[24] == "1"){
                ExtPlane.client.begin(simInputMap.AP_DISENGAGE.cmd);
                ExtPlane.client.end(simInputMap.AP_DISENGAGE.cmd);
            }
            //CO
            if (receivedData[25] == "1"){
                ExtPlane.client.begin(simInputMap.CO.cmd);
                ExtPlane.client.end(simInputMap.CO.cmd);
            }
        }
        
        
    });
});


function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

mcpSerialPort.on("open", function () {
    console.log("Serial Port " + mcpCOMPort + " is opened.");
});