export namespace structs {
	
	export class Position {
	    Lon: number;
	    Lat: number;
	
	    static createFrom(source: any = {}) {
	        return new Position(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Lon = source["Lon"];
	        this.Lat = source["Lat"];
	    }
	}
	export class FsData {
	    Connected: boolean;
	    AircraftName: string;
	    Position: Position;
	    Com1Stby: string;
	    Com1Act: string;
	    Com2Stby: string;
	    Com2Act: string;
	
	    static createFrom(source: any = {}) {
	        return new FsData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Connected = source["Connected"];
	        this.AircraftName = source["AircraftName"];
	        this.Position = this.convertValues(source["Position"], Position);
	        this.Com1Stby = source["Com1Stby"];
	        this.Com1Act = source["Com1Act"];
	        this.Com2Stby = source["Com2Stby"];
	        this.Com2Act = source["Com2Act"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

