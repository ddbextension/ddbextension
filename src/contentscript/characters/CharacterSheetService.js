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
                        if (loaded && mut.target.classList.value.indexOf('ReactModalPortal') !== -1) {
                            this.modalPortal(mut);
                        } else {
                            if (mut.target.classList.value.indexOf('character-sheet') !== -1) {
                                this.loadStatic(mut);
                            }
                            if (mut.target.classList.value.indexOf('attack-list-item') !== -1) {
                                this.attackListItem(mut);
                            }
                            if (mut.target.classList.value.indexOf('spell-list-item') !== -1) {
                                this.spellListItem(mut);
                            }
                            if (mut.target.querySelector('.ability-pool-list')) {
                                this.abilityPoolSpell(mut.addedNodes[0]);
                            }
                            mut.target.querySelectorAll('.limited-list-item-callout').forEach(lim => {
                                if (lim.querySelector('button') !== null) {
                                    lim.onclick = () => {
                                        if (lim.querySelector('button[class$="character-button-outline"]') !== null) {
                                            DiscordService.postMessageToDiscord(this.getCharacterName() + " used " + lim.parentNode.parentNode.querySelector('.collapsible-heading').textContent, this.getCharacterName(), this.getCharacterAvatar());
                                        }
                                    };
                                }
                            });

                            if (mut.addedNodes[0].localName !== 'img') {
                                if (mut.target.classList.value.indexOf('character-button-small') !== -1 && mut.target.querySelector('.value') === null) {
                                    let temp = mut.target.parentNode.parentNode.parentNode;
                                    if (temp.classList.value.indexOf('ability-pool-spell') !== -1) {
                                        this.abilitySpell(temp);
                                    }
                                }
                            }
                            if (mut.target.querySelector('.feature-proficiencies')) {
                                this.processProficiencies(mut.target.querySelector('.feature-proficiencies'));
                            }
                        }
                    }
                }
            });
        };

        var observer = new MutationObserver(callback);

        observer.observe(targetNode, config);
    }

    static slots(slots) {
        slots.forEach(slot => {
            console.log(slot);
        });
    }

    static processProficiencies(mut) {
        let profs = mut.querySelectorAll('.feature-proficiencies-item');
        profs.forEach(prof => {
            if (prof.querySelector('.value') === null) {
                let proficiency = prof.textContent;
                prof.onclick = () => {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + this.roll('1d20' + (character.proficiency >= 0 ? '+' : '') + character.proficiency) + ' for ' + proficiency, this.getCharacterName(), this.getCharacterAvatar());
                };
                this.branding(prof);
                prof.style.cursor = 'pointer';
            }
        });
    }

    static attackListItem(mut) {
        let item = mut.addedNodes[0];
        if (item.querySelector('.value') === null) {
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
            let save = item.parentNode.querySelector("div[class^='attack-item-callout-savedc']");
            let savedc = save.querySelector("div[class='attack-item-callout-tohit-value attack-item-callout-value']");
            if (savedc) {
                attack.savedc = Number(savedc.textContent) || 0;
            }
            let savetype = save.querySelector("div[class='attack-item-callout-tohit-label attack-item-callout-label']");
            if (savetype) {
                attack.savetype = this.reactText(savetype.textContent).substring(0, 3);
            }
            let value = item.parentNode.querySelector("div[class='attack-item-callout-dmg-value attack-item-callout-value']");
            if (value) {
                let verSel = value.querySelector('.attack-item-callout-dmg-versatile');
                if (verSel !== null) {
                    attack.versatile = verSel.textContent;
                    attack.value = this.reactText(value.textContent).substring(0, this.reactText(value.textContent).length - verSel.textContent.length);
                } else {
                    attack.value = this.reactText(value.textContent);
                }
            }
            let hits = document.createElement('div');
            hits.class = 'natural-attack-detail';
            let saves = document.createElement('div');
            saves.class = 'natural-attack-detail';
            let damage = document.createElement('div');
            damage.class = 'natural-attack-detail';
            item.prepend(damage);
            item.prepend(saves);
            item.prepend(hits);
            if (attack.value) {
                let damageButton = this.createButton('roll-damage', 'roll-damage', 'Roll Damage', (e) => {
                    if (attack.value.indexOf('d') !== -1) {
                        DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + this.roll((attack.value >= 0 ? '+' : '') + attack.value) + ' ' + attack.name + " damage", this.getCharacterName(), this.getCharacterAvatar());
                    } else {
                        DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + attack.value + ' ' + attack.name + " damage", this.getCharacterName(), this.getCharacterAvatar());
                    }
                });
                this.branding(damageButton.querySelector('.value'));
                damage.prepend(damageButton);
            }
            if (attack.savedc && attack.savetype) {
                let saveButton = this.createButton('roll-save', 'roll-save', 'Send Save', (e) => {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " used " + attack.name + " with a " + attack.savetype + " DC of " + attack.savedc, this.getCharacterName(), this.getCharacterAvatar());
                });
                this.branding(saveButton.querySelector('.value'));
                saves.prepend(saveButton);
            }
            if (attack.versatile) {
                let versatileButton = this.createButton('roll-damage', 'roll-damage', 'Roll Versatile Damage', (e) => {
                    if (attack.versatile.indexOf('d') !== -1) {
                        DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + this.roll((attack.versatile >= 0 ? '+' : '') + attack.versatile) + ' ' + attack.name + " damage", this.getCharacterName(), this.getCharacterAvatar());
                    } else {
                        DiscordService.postMessageToDiscord(this.getCharacterName() + " inflicted " + attack.versatile + ' ' + attack.name + " damage", this.getCharacterName(), this.getCharacterAvatar());
                    }
                });
                this.branding(versatileButton.querySelector('.value'));
                damage.prepend(versatileButton);
            }
            let dis = this.createButton('roll-hit-disadvantage', 'roll-hit-disadvantage', 'Disadvantage', (e) => {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a (disadvantaged) roll of " + this.disadvantage('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit), this.getCharacterName(), this.getCharacterAvatar());
            });
            let normal = this.createButton('roll-hit', 'roll-hit', 'Roll Hit', (e) => {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a roll of " + this.roll('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit), this.getCharacterName(), this.getCharacterAvatar());
            });
            let adv = this.createButton('roll-hit-advantage', 'roll-hit-advantage', 'Advantage', (e) => {
                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + attack.name + " with a (advantaged) roll of " + this.advantage('1d20' + (attack.tohit >= 0 ? '+' : '') + attack.tohit), this.getCharacterName(), this.getCharacterAvatar());
            });
            this.branding(dis.querySelector('.value'));
            this.branding(normal.querySelector('.value'));
            this.branding(adv.querySelector('.value'));
            hits.append(dis);
            hits.append(normal);
            hits.append(adv);
        }
    }

    static abilitySpell(row) {
        if (row.querySelector('.value') === null) {
            let abilityName = row.querySelector('.ability-pool-spell-name').innerText;
            let canUse = row.querySelector('button[class$="character-button-outline"]');
            if (canUse && !canUse.querySelector('.value')) {
                this.branding(canUse);
                canUse.onclick = () => {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + abilityName, this.getCharacterName(), this.getCharacterAvatar());
                };
            }
            let used = row.querySelector('button[class="character-button-small"]');
            if (used && !used.querySelector('.value')) {
                this.branding(used);
            }
            let usage = row.querySelector('.ability-pool-spell-usage');
            if (usage && !usage.querySelector('.value')) {
                let usageButton = this.createButton('ability-pool', 'ability-pool', usage.innerHTML, (e) => {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + abilityName, this.getCharacterName(), this.getCharacterAvatar());
                });
                usage.class = 'ability-pool-spell-slots';
                usage.innerHTML = '';
                this.branding(usageButton.querySelector('.value'));
                usage.prepend(usageButton);
            }
        }
    }

    static abilityPoolSpell(mut) {
        let rows = mut.querySelectorAll("div[class^='ability-pool-spell ']");
        rows.forEach(row => {
            this.abilitySpell(row);
        });
        let slots = mut.querySelectorAll('.slot-manager-slot');
        if (slots.length > 0) {
            this.branding(mut.querySelector('.slot-manager'));
        }
        slots.forEach(slot => {
            slot.onclick = () => {
                if (slot.classList.value.indexOf('slot-manager-slot-used') === -1) {
                    let parent = slot.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
                    let slotName = parent.querySelector('.collapsible-heading').textContent;
                    DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + slotName, this.getCharacterName(), this.getCharacterAvatar());
                }
            };
        });
    }

    static spellListItem(mut) {
        let item = mut.addedNodes[0];
        if (item.querySelector('.value') === null) {
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
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + " with a " + spell.dcType + " DC of " + spell.dc + (spell.desc ? (': ' + spell.desc) : ''), this.getCharacterName(), this.getCharacterAvatar());
                        } else {
                            if (spell.tohit || spell.tohit === 0) {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + spell.name + " with a roll of " + this.roll('1d20' + spell.tohit) + (spell.desc ? (': ' + spell.desc) : ''), this.getCharacterName(), this.getCharacterAvatar());
                            } else {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + (spell.desc ? (': ' + spell.desc) : ''), this.getCharacterName(), this.getCharacterAvatar());
                            }
                        }
                    };
                } else {
                    let spellAction;

                    if (spell.dcType) {
                        spellAction = this.createOversizeButton('spell-action', 'spell-action', 'Send DC', (e) => {
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + " with a " + spell.dcType + " DC of " + spell.dc + (spell.desc ? (': ' + spell.desc) : ''), this.getCharacterName(), this.getCharacterAvatar());
                        });
                    } else {
                        if (spell.tohit || spell.tohit === 0) {
                            spellAction = this.createOversizeButton('spell-action', 'spell-action', 'Roll to hit', (e) => {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " attempts to use " + spell.name + " with a roll of " + this.roll('1d20' + spell.tohit) + (spell.desc ? (': ' + spell.desc) : ''), this.getCharacterName(), this.getCharacterAvatar());
                            });
                        } else {
                            spellAction = this.createOversizeButton('spell-action', 'spell-action', 'Send', (e) => {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " uses " + spell.name + (spell.desc ? (': ' + spell.desc) : ''), this.getCharacterName(), this.getCharacterAvatar());
                            });
                        }
                    }
                    this.branding(spellAction.querySelector('.value'));
                    item.prepend(spellAction);
                }

                let rows = item.querySelectorAll('.spell-caster-damage');
                rows.forEach(row => {
                    console.log(row);
                });
            }
        }
    }

    static modalPortal(mut) {
        let mod = mut.addedNodes[0];
        let def = mod.querySelector('.defenses-manager');
        if (def) {
            let defButton = this.createOversizeButton('armor-class', 'armor-class', 'Send', (e) => {
                if (character.armorClass) {
                    DiscordService.postMessageToDiscord(this.getCharacterName() + "'s AC is " + character.armorClass, this.getCharacterName(), this.getCharacterAvatar());
                }
            });
            this.branding(defButton.querySelector('.value'));
            def.prepend(defButton);
        }
    }

    static loadStatic(mut) {
        if (!loaded) {
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
                    return DiceExp.calcValue(dice).format(dice, true);
                }

                static advantage(dice) {
                    return DiceExp.calcValue(dice).format(dice, true);
                }

                static disadvantage(dice) {
                    return DiceExp.calcValue(dice).format(dice, true);
                }

                static getCharacterName() {
                    return document.querySelector("div[class='character-tidbits-name']").textContent;
                }

                static getCharacterAvatar() {
                    if (document.querySelector("div[class='character-tidbits-avatar']") !== null) {
                        let img = document.querySelector("div[class='character-tidbits-avatar']").style['background-image'];
                        return img.substring(5, img.length - 2);
                    } else {
                        return null;
                    }
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
                            DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled an initative of " + this.roll('1d20' + (initiative >= 0 ? '+' : '') + initiative), this.getCharacterName(), this.getCharacterAvatar());
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
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + ability.name + " of " + this.roll('1d20' + (ability.modifier >= 0 ? '+' : '') + ability.modifier), this.getCharacterName(), this.getCharacterAvatar());
                                }
                            };

                            save.style.cursor = 'pointer';
                            this.branding(save);
                            save.onclick = () => {
                                if (ability.save || ability.save === 0) {
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + ability.name + " save of " + this.roll('1d20' + (ability.save >= 0 ? '+' : '') + ability.save), this.getCharacterName(), this.getCharacterAvatar());
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
                                    DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a " + skill.name + " of " + this.roll('1d20' + (skill.value >= 0 ? '+' : '') + skill.value), this.getCharacterName(), this.getCharacterAvatar());
                                }
                            };

                            skills.push(skill);
                        });
                        character.skills = skills;
                    });
                }

                static getProficiency() {
                    onElementReady("div[class='quick-info-item quick-info-proficiency-bonus']").then($element => {
                        this.getCharacterAvatar();
                        let parent = $element
                            .querySelector("div[class='quick-info-item-value']");

                        character.proficiency = Number(this.reactText(parent.textContent)) || 0;
                        $element.style.cursor = 'pointer';
                        this.branding($element.querySelector('.quick-info-item-value'));
                        $element.onclick = () => {
                            if (character.proficiency) {
                                DiscordService.postMessageToDiscord(this.getCharacterName() + " rolled a proficiency of " + this.roll('1d20' + (character.proficiency >= 0 ? '+' : '') + character.proficiency), this.getCharacterName(), this.getCharacterAvatar());
                            }
                        };
                    });
                }
            }

            export default CharacterSheetService;