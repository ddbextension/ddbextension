const diceExpRegex = /^(\s*(\+|-)?\s*(([0-9]{0,10}d[0-9]{1,10})|([0-9]{1,10}))\s*)(\s*(\+|-)\s*(([0-9]{0,10}d[0-9]{1,10})|([0-9]{1,10}))\s*)*$/i;

/**
 * Roll a dice.
 * @param {number} diceValue The number value of the dice.
 * @returns {number} The value of the dice roll.
 */
const rollDice = function (diceValue) {
    return Math.floor(Math.random() * diceValue + 1);
};

/**
 * Roll a number of dice (caps at 99999) and add the results.
 * @param {*} numberOfDice
 * @param {*} diceValue
 */
const rollAllDice = function (numberOfDice, diceValue) {
    var total = 0;
    var rolls = [];
    for (var i = 0; i < numberOfDice % 100000; i++) {
        let roll = rollDice(diceValue);
        rolls.push(roll);
        total += roll;
    }
    return {
        total: total,
        rolls: rolls
    };
};

/**
 * Calcs a dice expression term.
 */
const calcTermValue = function (term: string) {
    var isVariable = term.indexOf("d") !== -1;
    if (!isVariable) return {
        total: Number(term),
        rolls: []
    };

    var variableTokens = term.split("d");
    var multiplier = variableTokens[0].length === 0 ? 1 : Number(variableTokens[0]);
    var diceValue = Number(variableTokens[1]);

    if (diceValue > 0) {
        return rollAllDice(multiplier, diceValue);
    }

    return {
        total: 0,
        rolls: []
    };
};

/**
 * Calcs a dice expression value.
 */
const calcDiceExpValue = function (diceExp: string, expanded = false) {
    var spaceLessExp = diceExp.replace(/\s/g, "").toLowerCase();
    var value = 0;
    var token = "";
    var add = true;
    let rolls = [];
    let termValue = {};
    for (var i = 0; i < spaceLessExp.length; i++) {
        if (spaceLessExp[i] === "+" || spaceLessExp[i] === "-") {
            termValue = calcTermValue(token);
            rolls = rolls.concat.apply(rolls, termValue.rolls);
            if (add) value += termValue.total;
            else value -= termValue.total;

            add = spaceLessExp[i] === "+";
            token = "";
            continue;
        }
        token += spaceLessExp[i];
    }
    termValue = calcTermValue(token);
    rolls = rolls.concat.apply(rolls, termValue.rolls);
    if (add) value += termValue.total;
    else value -= termValue.total;

    if (expanded) {
        return `${value} (${diceExp}: ${rolls.join(', ')})`;
    } else {
        return `${value} (${diceExp})`;
    }
};

class DiceExp {

    static isDiceExp(diceExp: string) {
        if (!diceExp) return false;
        return diceExpRegex.test(diceExp.trim());
    }

    /**
     * Calcs a dice expression value.
     */
    static calcValue(diceExp: string, expanded = false) {
        let innerDiceExp = diceExp;
        if (typeof innerDiceExp !== "string") {
            throw new Error("Only strings are supported.");
        }
        innerDiceExp = innerDiceExp.trim();
        if (innerDiceExp === "") {
            throw new Error("Empty expression.");
        }
        if (innerDiceExp.startsWith("(") && innerDiceExp.endsWith(")")) {
            innerDiceExp = innerDiceExp.substring(1, innerDiceExp.length - 1);
        }
        if (!diceExpRegex.test(innerDiceExp)) {
            throw new Error(`The expression "${diceExp}" is not a valid expression.`);
        }
        return calcDiceExpValue(innerDiceExp, expanded);
    }
}

export default DiceExp;