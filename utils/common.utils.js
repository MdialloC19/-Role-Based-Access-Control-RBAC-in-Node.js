import {v4} from "uuid";

export const randomString = (size = 24) => {
    return v4();
}


const isPrime = (n) => {
    if (n < 2) return false;
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) return false;
    }
    return true;
}


export default { randomString };