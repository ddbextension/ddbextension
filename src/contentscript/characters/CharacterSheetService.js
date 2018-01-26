import $ from "jquery";
import React from 'react';
import ReactDOM from 'react-dom';
import MessageService from "../../services/MessageService";
import CharacterSheetButton from "./CharacterSheetButton";
import CharacterSheetButtonOversized from "./CharacterSheetButtonOversized";
import DiceExp from "../../services/DiceExp";
import DiscordService from '../../services/DiscordService';

var onElementReady = (sel) => {
    return new Promise((resolve) => {
        var waitForElement = () => {
            const $element = document.querySelector(sel);
            if ($element) {
                resolve($element);
            } else {
                window.requestAnimationFrame(waitForElement);
            }
        };
        waitForElement();
    });
};

/* global chrome */

let loadCheck;
let character = {};
let loaded = false;

class CharacterSheetService {
    static init() {
        const path = window.location.pathname;
        if (!(path.startsWith("/profile/") && path.indexOf('/characters/') !== -1)) return;

        var targetNode = document.body;

        var config = {
            childList: true,
            subtree: true
        };

        // Callback function to execute when mutations are observed
        var callback = (mutationsList) => {
            mutationsList.forEach(mut => {
                if (mut.addedNodes.length !== 0) {
                    if (mut && mut.target) {
                        if (mut.target.classList.value.indexOf('character-sheet') !== -1) {
                            this.loadStatic(mut);
                        }
                        if (mut.target.classList.value.indexOf('attack-list-item') !== -1) {
                            this.attackListItem(mut);
                        }
                        // if (mut.target.classList.value.indexOf('ability-pool-spell') !== -1) {
                        //     this.abilityPoolSpell(mut);
                        // }
                        if (mut.target.classList.value.indexOf('spell-list-item') !== -1) {
                            this.spellListItem(mut);
                        }
                        if (mut.target.classList.value.indexOf('ReactModalPortal') !== -1) {
                            this.modalPortal(mut);
                        }
                        if (mut.target.querySelector('.ability-pool-list')) {
                            this.abilityPoolSpell(mut.addedNodes[0]);
                        }
                        if (mut.target.classList.value.indexOf('character-button-small') !== -1 && !mut.target.querySelector('.value')) {
                            let temp = mut.target.parentNode.parentNode.parentNode.parentNode.parentNode;
                            if (temp.classList.value === 'ability-pool') {
                                // this.abilityPoolSpell(temp); // not working
                                console.log(temp);
                            }
                        }
                        if (mut.target.querySelector('.feature-proficiencies')) {
                            this.processProficiencies(mut.target.querySelector('.feature-proficiencies'));
                        }
                    }
                }
            });
        };

        var observer = new MutationObserver(callback);

        observer.observe(targetNode, config);
    }

    static processProficiencies(mut) {
        let profs = mut.querySelectorAll('.feature-proficiencies-item');
        profs.forEach(prof => {
            let proficiency = prof.textContent;
            prof.onclick = () => {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + this.roll('1d20' + (character.proficiency >= 0 ? '+' : '') + character.proficiency) + ' for ' + proficiency);
            };
            this.branding(prof);
            prof.style.cursor = 'pointer';
        });
    }

    static attackListItem(mut) {
        let item = mut.addedNodes[0];
        let attack = {};
        attack.name = item.parentNode.querySelector("span[class='attack-list-heading-text']").textContent;
        if (attack.name.indexOf('span') !== -1) {
            let start = attack.name.indexOf('>') + 1;
            let end = attack.name.indexOf('</');
            attack.name = attack.name.substring(start, end);
        }
        let tohit = item.parentNode.querySelector("div[class='attack-item-callout-tohit-value attack-item-callout-value']");
        if (tohit) {
            attack.tohit = Number(tohit.textContent) || 0;
        }
        let value = item.parentNode.querySelector("div[class='attack-item-callout-dmg-value attack-item-callout-value']");
        if (value) {
            attack.value = this.reactText(value.textContent);
        }
        let hits = document.createElement('div');
        hits.class = 'natural-attack-detail';
        let damage = document.createElement('div');
        damage.class = 'natural-attack-detail';
        item.prepend(damage);
        item.prepend(hits);
        let damageButton = this.createButton('roll-damage', 'roll-damage', 'Roll Damage', (e) => {
            if (character.armorClass) {
                if (attack.value.indexOf('d') !== -1) {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + this.roll((attack.value >= 0 ? '+' : '') + attack.value) + ' ' + attack.name + " damage");
                } else {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + attack.value + ' ' + attack.name + " damage");
                }
            }
        });
        let dis = this.createButton('roll-hit-disadvantage', 'roll-hit-disadvantage', 'Disadvantage', (e) => {
            if (character.armorClass) {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a (disadvantaged) roll of " + this.disadvantage('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit));
            }
        });
        let normal = this.createButton('roll-hit', 'roll-hit', 'Roll Hit', (e) => {
            if (character.armorClass) {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a roll of " + this.roll('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit));
            }
        });
        let adv = this.createButton('roll-hit-advantage', 'roll-hit-advantage', 'Advantage', (e) => {
            if (character.armorClass) {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a (advantaged) roll of " + this.advantage('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit));
            }
        });
        this.branding(damageButton.querySelector('.value'));
        damage.prepend(damageButton);
        this.branding(dis.querySelector('.value'));
        this.branding(normal.querySelector('.value'));
        this.branding(adv.querySelector('.value'));
        hits.append(dis);
        hits.append(normal);
        hits.append(adv);
    }

    static abilityPoolSpell(mut) {
        let rows = mut.querySelectorAll("div[class^='ability-pool-spell ']");
        rows.forEach(row => {
            let canUse = row.querySelector('button[class$="character-button-outline"]');
            if (canUse && !canUse.querySelector('.value')) {
                this.branding(canUse);
                canUse.onclick = () => {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " uses something");
                };
            }
            let used = row.querySelector('button[class="character-button-small"]');
            if (used && !used.querySelector('.value')) {
                this.branding(used);
            }
            let usage = row.querySelector('.ability-pool-spell-usage');
            if (usage && !usage.querySelector('.value')) {
                let usageButton = this.createButton('ability-pool', 'ability-pool', usage.innerHTML, (e) => {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " uses something");
                });
                usage.class = 'ability-pool-spell-slots';
                usage.innerHTML = '';
                this.branding(usageButton.querySelector('.value'));
                usage.prepend(usageButton);
            }
        });

    }

    static spellListItem(mut) {
        let item = mut.addedNodes[0];
        let spell = {};
        if (item.parentNode.querySelector("span[class='spell-list-heading-text']")) {
            spell.name = item.parentNode.querySelector("span[class='spell-list-heading-text']").textContent;
            let desc = (item.parentNode.querySelector("div[class='truncated-content-content']") || {}).textContent;
            if (desc) {
                spell.desc = desc;
            }
            if (item.parentNode.querySelector("span[class='collapsible-header-callout-extra']")) {
                let type = item.parentNode.querySelector("span[class='collapsible-header-callout-extra']").textContent;
                let value = item.parentNode.querySelector("span[class='collapsible-header-callout-value']");
                if (type === 'To Hit') {
                    spell.tohit = value.textContent;
                } else {
                    spell.dc = value.textContent;
                    spell.dcType = type;
                }
                spell.props = [];
                let props = item.parentNode.querySelectorAll("div[class^='prop-list-item']");
                props.forEach(propRow => {
                    let prop = {
                        label: (propRow.querySelector("div[class='prop-list-item-label']") || {}).textContent,
                        value: this.reactText((propRow.querySelector("div[class='prop-list-item-value']") || {}).textContent)
                    };
                    if (prop.label && prop.value) {
                        spell.props.push(prop);
                    }
                });
            }

            let spellCasterAction = item.querySelector('.spell-caster-action');
            if (spellCasterAction) {
                item.onclick = () => {
                    if (spell.dcType) {
                        DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + " with a " + spell.dcType + " DC of " + spell.dc + (spell.desc ? (': ' + spell.desc) : ''));
                    } else {
                        if (spell.tohit || spell.tohit === 0) {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + spell.name + " with a roll of " + this.roll('1d20' + spell.tohit) + (spell.desc ? (': ' + spell.desc) : ''));
                        } else {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + (spell.desc ? (': ' + spell.desc) : ''));
                        }
                    }
                };
            } else {
                let spellAction;

                if (spell.dcType) {
                    spellAction = this.createOversizeButton('spell-action', 'spell-action', 'Send DC', (e) => {
                        DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + " with a " + spell.dcType + " DC of " + spell.dc + (spell.desc ? (': ' + spell.desc) : ''));
                    });
                } else {
                    if (spell.tohit || spell.tohit === 0) {
                        spellAction = this.createOversizeButton('spell-action', 'spell-action', 'Roll to hit', (e) => {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + spell.name + " with a roll of " + this.roll('1d20' + spell.tohit) + (spell.desc ? (': ' + spell.desc) : ''));
                        });
                    } else {
                        spellAction = this.createOversizeButton('spell-action', 'spell-action', 'Send', (e) => {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + (spell.desc ? (': ' + spell.desc) : ''));
                        });
                    }
                }
                this.branding(spellAction.querySelector('.value'));
                item.prepend(spellAction);
            }
        }
    }

    static modalPortal(mut) {
        let mod = mut.addedNodes[0];
        let def = mod.querySelector('.defenses-manager');
        if (def) {
            let defButton = this.createOversizeButton('armor-class', 'armor-class', 'Send', (e) => {
                if (character.armorClass) {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + "'s AC is " + character.armorClass);
                }
            });
            this.branding(defButton.querySelector('.value'));
            def.prepend(defButton);
        }
    }

    static loadStatic(mut) {
        if (!loaded) {
            console.log('static');
            this.getArmorClass();
            this.getInitiative();
            this.getAbilities();
            this.getSkills();
            this.getProficiency();
            loaded = true;
        }
    }

    static createButton(id: string, name: string, value: string, roll: Function) {
            const buttonSpan = document.createElement("span");
            ReactDOM.render( < CharacterSheetButton onClick = {
                    roll
                }
                value = {
                    value
                }
                />, buttonSpan);
                return buttonSpan;
            }

            static createOversizeButton(id: string, name: string, value: string, roll: Function) {
                const buttonSpan = document.createElement("span");
                ReactDOM.render( < CharacterSheetButtonOversized onClick = {
                        roll
                    }
                    value = {
                        value
                    }
                    />, buttonSpan);
                    return buttonSpan;
                }

                static roll(dice) {
                    return DiceExp.calcValue(dice, true);
                }

                static advantage(dice) {
                    return DiceExp.calcValue(dice, true);
                }

                static disadvantage(dice) {
                    return DiceExp.calcValue(dice, true);
                }

                static expandAll() {
                    return new Promise((resolve, reject) => {
                        let collapseCheck = setInterval(() => {
                            let collapsed = document.querySelectorAll("div[class$='collapsible-collapsed']");
                            if (collapsed.length !== 0) {
                                collapsed.forEach(function (ele) {
                                    let triggers = ele.querySelectorAll("div[class$='trigger']");
                                    triggers.forEach(trigger => {
                                        trigger.click();
                                    });
                                });
                            } else {
                                let contentHidden = document.querySelectorAll("div[class^='truncated-content truncated-content-hidden']");
                                contentHidden.forEach(function (ele) {
                                    let triggers = ele.querySelectorAll("span[class='truncated-content-trigger-label']");
                                    triggers.forEach(trigger => {
                                        trigger.click();
                                    });
                                });
                                clearInterval(collapseCheck);
                                console.log('everything is expanded');
                                resolve();
                            }
                        }, 100);
                    });
                }

                static collapseAll() {
                    return new Promise((resolve, reject) => {
                        let expandCheck = setInterval(() => {
                            let collapsed = document.querySelectorAll("div[class$='collapsible-opened']");
                            if (collapsed.length !== 0) {
                                collapsed.forEach(function (ele) {
                                    let triggers = ele.querySelectorAll("div[class$='trigger']");
                                    triggers.forEach(trigger => {
                                        trigger.click();
                                    });
                                });
                            } else {
                                clearInterval(expandCheck);
                                console.log('everything is collapsed');
                                resolve();
                            }
                        }, 100);
                    });
                }

                static getCharacterName() {
                    return document.querySelector("div[class='character-tidbits-name']").textContent;
                }

                static branding($element, inner = false) {
                    let img = document.createElement('img');
                    img.src = chrome.extension.getURL("webaccessible/images/icon-16.png");
                    img.width = 14;
                    img.height = 14;
                    img.style['margin-bottom'] = '3px';
                    img.style['margin-right'] = '3px';
                    img.alt = 'D&D Beyond Extension';
                    img.title = 'D&D Beyond Extension';
                    $element.prepend(img);
                }

                static getArmorClass() {
                    onElementReady("div[class='quick-info-item quick-info-armor-class']").then($element => {
                        let acSel = $element.querySelector("div[class='quick-info-item-value']");
                        this.branding(acSel);
                        let ac = Number(acSel.textContent) || 10;
                        character.armorClass = ac;
                    });
                }

                static getInitiative() {
                    onElementReady("div[class='quick-info-item quick-info-initiative']").then($element => {
                        $element.style.cursor = 'pointer';
                        this.branding($element.querySelector('.quick-info-item-value'));

                        let parent = $element.querySelector("div[class='quick-info-item-value']");
                        let initiative = Number(this.reactText(parent.textContent)) || 0;
                        if (parent.querySelector("span[class='quick-info-item-value-extra']").textContent === '-') {
                            initiative = -initiative;
                        }
                        character.initiative = initiative;
                        $element.onclick = () => {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled an initative of " + this.roll('1d20' + (initiative >= 0 ? '+' : '') + initiative));
                        };
                    });
                }

                static reactText(value) {
                    let text = value;
                    while (value && value.indexOf('-->') !== -1) {
                        let valStart = value.indexOf('-->') + 3;
                        let valEnd = value.indexOf('<!-- /react-text -->');
                        text = text.substring(valStart, valEnd);
                    }
                    return text;
                }

                static getAbilities() {
                    onElementReady("tr[class^='character-ability-row']").then($element => {
                        let abilities = [];
                        let rows = document.querySelectorAll("tr[class^='character-ability-row']");
                        rows.forEach(row => {
                            let ability = {};
                            ability.name = row.querySelector("th[class='character-ability-item character-ability-label']").textContent;
                            ability.value = Number(row.querySelector("td[class='character-ability-item character-ability-score']").textContent) || 0;
                            let mod = row.querySelector("td[class='character-ability-item character-ability-modifier']");

                            ability.modifier = Number(mod.querySelector("span[class='character-ability-stat-value']").textContent) || 0;
                            if (row.querySelector("td[class='character-ability-item character-ability-modifier']").querySelector("span[class='character-ability-stat-extra']").textContent === '-') {
                                ability.modifier = -ability.modifier;
                            }

                            let save = row.querySelector("td[class='character-ability-item character-ability-save']");
                            ability.save = Number(save.querySelector("span[class='character-ability-stat-value']").textContent) || 0;
                            if (row.querySelector("td[class='character-ability-item character-ability-save']").querySelector("span[class='character-ability-stat-extra']").textContent === '-') {
                                ability.save = -ability.save;
                            }

                            mod.style.cursor = 'pointer';
                            this.branding(mod);
                            mod.onclick = () => {
                                if (ability.modifier || ability.modifier === 0) {
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + ability.name + " of " + this.roll('1d20' + (ability.modifier >= 0 ? '+' : '') + ability.modifier));
                                }
                            };

                            save.style.cursor = 'pointer';
                            this.branding(save);
                            save.onclick = () => {
                                if (ability.save || ability.save === 0) {
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + ability.name + " save of " + this.roll('1d20' + (ability.save >= 0 ? '+' : '') + ability.save));
                                }
                            };

                            abilities.push(ability);
                        });
                        character.abilities = abilities;
                    });
                }

                static getSkills() {
                    onElementReady("div[class='skill-item']").then($element => {
                        let skills = [];
                        let rows = document.querySelectorAll("div[class='skill-item']");
                        rows.forEach(row => {
                            let skill = {};
                            skill.name = this.reactText(row.querySelector("span[class='skill-item-name']").textContent);
                            skill.value = Number(this.reactText(row.querySelector("span[class='skill-item-modifier']").querySelector("span[class='skill-item-modifier-value']").textContent)) || 0;
                            if (row.querySelector("span[class='skill-item-modifier']").querySelector("span[class='skill-item-modifier-extra']").textContent === '-') {
                                skill.value = -skill.value;
                            }

                            row.style.cursor = 'pointer';
                            this.branding(row.querySelector("span[class='skill-item-name']"));
                            row.onclick = () => {
                                if (skill.value || skill.value === 0) {
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + skill.name + " of " + this.roll('1d20' + (skill.value >= 0 ? '+' : '') + skill.value));
                                }
                            };

                            skills.push(skill);
                        });
                        character.skills = skills;
                    });
                }

                static getProficiency() {
                    onElementReady("div[class='quick-info-item quick-info-proficiency-bonus']").then($element => {
                        let parent = $element
                            .querySelector("div[class='quick-info-item-value']");

                        character.proficiency = Number(this.reactText(parent.textContent)) || 0;
                        $element.style.cursor = 'pointer';
                        this.branding($element.querySelector('.quick-info-item-value'));
                        $element.onclick = () => {
                            if (character.proficiency) {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a proficiency of " + this.roll('1d20' + (character.proficiency >= 0 ? '+' : '') + character.proficiency));
                            }
                        };
                    });
                }

                static getProficiencies() {
                    let proficiencies = [];
                    let rows = document.querySelectorAll("ul[class='feature-proficiencies']");
                    rows.forEach(row => {
                        row.querySelectorAll("li[class='feature-proficiencies-item']").forEach(prof => {
                            let proficiency = prof.textContent;
                            proficiencies.push(proficiency);
                            let profButton = this.createButton(proficiency, proficiency, 'Roll', (e) => {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + proficiency + " of " + this.roll('1d20' + (character.proficiency >= 0 ? '+' : '') + character.proficiency));
                            });
                            this.branding(profButton.querySelector('.value'));
                            prof.appendChild(profButton);
                        });
                    });
                    return proficiencies;
                }

                static getAttacks() {
                    let attacks = [];
                    let rows = document.querySelectorAll("div[class^='attack-list-item']");
                    rows.forEach(row => {
                        let attack = {};
                        attack.name = row.querySelector("span[class='attack-list-heading-text']").textContent;
                        if (attack.name.indexOf('span') !== -1) {
                            let start = attack.name.indexOf('>') + 1;
                            let end = attack.name.indexOf('</');
                            attack.name = attack.name.substring(start, end);
                        }
                        let tohit = row.querySelector("div[class='attack-item-callout-tohit-value attack-item-callout-value']");
                        if (tohit) {
                            attack.tohit = Number(tohit.textContent) || 0;
                            let tohitButton = this.createButton(attack.name, attack.name, 'Roll', (e) => {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a roll of " + this.roll('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit));
                            });
                            this.branding(tohitButton.querySelector('.value'));
                            tohit.parentNode.appendChild(tohitButton);
                        }
                        let value = row.querySelector("div[class='attack-item-callout-dmg-value attack-item-callout-value']");
                        if (value) {
                            attack.value = this.reactText(value.textContent);
                            let attackButton = this.createButton(attack.name, attack.name, 'Roll', (e) => {
                                if (attack.value.indexOf('d') !== -1) {
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + this.roll((attack.value >= 0 ? '+' : '') + attack.value) + ' ' + attack.name + " damage");
                                } else {
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + attack.value + ' ' + attack.name + " damage");
                                }
                            });
                            this.branding(attackButton.querySelector('.value'));
                            value.parentNode.appendChild(attackButton);
                        }

                        attacks.push(attack);
                    });
                    return attacks;
                }

                static getFeats() {
                    let feats = [];
                    let rows = document.querySelectorAll("div[class='feature-group']");
                    rows.forEach(row => {
                        let feat = {};
                        feat.name = row.querySelector("div[class='feature-group-heading']").textContent;
                        feat.body = row.querySelector("div[class='feat-desc']").textContent;
                        let featButton = this.createButton(feat.name, feat.name, 'Send', (e) => {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " has a feat of " + feat.name + ": " + feat.body);
                        });
                        this.branding(featButton.querySelector('.value'));
                        row.querySelector("div[class='feature-group-heading']").appendChild(featButton);
                        feats.push(feat);
                    });

                    return feats;
                }

                static getSpells() {
                    let spells = [];
                    let rows = document.querySelectorAll("div[class='class-spell-list-actives']");
                    rows.forEach(row => {
                        let rowSpells = row.querySelectorAll("div[class^='spell-list-item '");
                        rowSpells.forEach(rowSpell => {
                            let spell = {};
                            if (rowSpell.querySelector("span[class='spell-list-heading-text']")) {
                                spell.name = rowSpell.querySelector("span[class='spell-list-heading-text']").textContent;
                                let desc = (rowSpell.querySelector("div[class='truncated-content-content']") || {}).textContent;
                                if (desc) {
                                    spell.desc = desc;
                                }
                                if (rowSpell.querySelector("span[class='collapsible-header-callout-extra']")) {
                                    let type = rowSpell.querySelector("span[class='collapsible-header-callout-extra']").textContent;
                                    let value = rowSpell.querySelector("span[class='collapsible-header-callout-value']");
                                    if (type === 'To Hit') {
                                        spell.tohit = value.textContent;
                                        let hitButton = this.createButton(spell.name, spell.name, 'Roll', (e) => {
                                            DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + spell.name + " with a roll of " + this.roll('1d20' + spell.tohit) + (spell.desc ? (': ' + spell.desc) : ''));
                                        });
                                        this.branding(hitButton.querySelector('.value'));
                                        value.parentNode.appendChild(hitButton);
                                    } else {
                                        spell.dc = value.textContent;
                                        spell.dcType = type;
                                        let spellButton = this.createButton(spell.name, spell.name, 'Send', (e) => {
                                            DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + " with a " + type + " DC of " + spell.dc + (spell.desc ? (': ' + spell.desc) : ''));
                                        });
                                        this.branding(spellButton.querySelector('.value'));
                                        value.parentNode.appendChild(spellButton);
                                    }
                                    spell.props = [];
                                    let props = rowSpell.querySelectorAll("div[class^='prop-list-item']");
                                    props.forEach(propRow => {
                                        let prop = {
                                            label: (propRow.querySelector("div[class='prop-list-item-label']") || {}).textContent,
                                            value: this.reactText((propRow.querySelector("div[class='prop-list-item-value']") || {}).textContent)
                                        };
                                        if (prop.label && prop.value) {
                                            spell.props.push(prop);
                                        }
                                    });
                                } else {
                                    let spellButton = this.createButton(spell.name, spell.name, 'Send', (e) => {
                                        DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + (spell.desc ? (': ' + spell.desc) : ''));
                                    });
                                    this.branding(spellButton.querySelector('.value'));
                                    rowSpell.querySelector("span[class='spell-list-heading-text']").appendChild(spellButton);
                                }
                                spells.push(spell);
                            }
                        });
                    });

                    return spells;
                }
            }

            export default CharacterSheetService;

            /*
            {
              armorClass: { quick-info-item quick-info-armor-class
                value: quick-info-item-value
              }
              initiative: { quick-info-item quick-info-initiative
                extra: quick-info-item-value-extra,
                value: quick-info-item-value (without the extra span)
              },
              ability: { character-ability-row
                value: character-ability-item character-ability-score,
                name: character-ability-item character-ability-label,
                modifier: { character-ability-item character-ability-modifier
                  value: character-ability-stat-value
                  extra: character-ability-stat-extra
                },
                save: { character-ability-item character-ability-save
                  value: character-ability-stat-value,
                  extra: character-ability-stat-extra
                }
              },
              skills: [
                { skill-item
                  stat: skill-item-stat,
                  name: skill-item-name,
                  modifier: { skill-item-modifier
                    extra: skill-item-modifier-extra,
                    value: skill-item-modifier-value
                  }
                }
              ],
              proficiencies: [ feature-proficiencies
                feature-proficiencies-item
              ],
              proficiency: { quick-info-item quick-info-proficiency-bonus
                value: quick-info-item-value (without the span)
              },
              attacks: [ attack-list-item
                {
                  name: attack-list-heading-text,
                  tohit: attack-item-callout-tohit-value attack-item-callout-value,
                  damage: attack-item-callout-dmg-value attack-item-callout-value
                }
              ],
              feats: [ collapsible-header... <div class="collapsible-heading">Feats</div>
                { feature-group
                  name: feature-group-heading,
                  body: feat-desc
                }
              ],
              spells: [ class-spell-list-actives (multiple)
                { ^ div spell-list-item
                    name: span spell-list-heading-text
                }
              ]
            }
            */