
export type PizzaSize = 'S' | 'M' | 'L' | 'XL';

export enum PizzaCrust {
    Neapolitan = 'Neapolitan',
    NewYork = 'New York',
    StLouis = 'St. Louis',
    Pan = 'Pan',
    DeepDish = 'Deep Dish',
    Sicilian = 'Sicilian',
}

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