export interface Flight { 
    id: number;
    destination: string;
    flightNo: number;
    price: number;
    departure: number;
    arrival: number;
    return: number;
}

export namespace Flight {}