class DiceRollResult {
    constructor(total: number, rolls: number[]) {
        this.total = total;
        this.rolls = rolls;
    }

    add(result: DiceRollResult): DiceRollResult {
        this.total += result.total;
        this.rolls = this.rolls.concat(result.rolls);
        return this;
    }

    subtract(result: DiceRollResult): DiceRollResult {
        this.total -= result.total;
        this.rolls = this.rolls.concat(result.rolls);
        return this;
    }

    format(diceExp: string, expanded: boolean): string {
        return expanded ? `${this.total} (${diceExp}: ${this.rolls.join(', ')})` : `${this.total} (${diceExp})`;
    }
}

export default DiceRollResult;