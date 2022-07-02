export interface DailyRate { 
    sell_currency: string;
    buy_currency: string;
    fixed_side: string;
    action_type: string;
    rate: number;
    date: string;
    sell_amount: number;
    buy_amount: number;
}

export namespace DailyRate {}