class Check {
    private message: string;

    constructor(message: string) {
        this.message = message;
    }

    public getMessage(): string {
        return this.message;
    }
}

export default Check;