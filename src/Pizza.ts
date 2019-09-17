
export type PizzaSize = 'S' | 'M' | 'L' | 'XL';

export type PizzaCrust = 'neapolitan' | 'new_york' | 'st_louis' | 'pan' | 'deep_dish' | 'Sicilian';

export type City = 'napoli' | 'paris' | 'chicago' | 'new_york' | 'hawaii';

export interface PizzaSpec {
    size?: PizzaSize;
    crust?: PizzaCrust;
    toppings?: string[];
}

export interface PizzaOrder {
    city?: City;
    pizza?: PizzaSpec;
    payment?: 'Credit Card' | 'Cash' | 'Online';
}