export interface User {
    id: string;
    name: string;
}

export interface Player extends User {
    team: number;
    host: boolean;
}
