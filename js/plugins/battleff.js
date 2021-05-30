//=============================================================================
// Coolie Plugins - FF Style Battle Log
// Coolie_FF_Battle_Log.js
// Version: 1.02 [November 8th, 2015]
//=============================================================================
 
var Imported = Imported || {};
Imported.Coolie_FF_Battle_Log = true;
 
var Coolie = Coolie || {};
 
//=============================================================================
/*:
 * @plugindesc [v1.0] Changes the behavior of the default BattleLog
 * to act similarly to the BatteLog in a Final Fantasy game.
 * @author William Couillard (Coolie)
 *
 * @param Log Window Width
 * @desc Adjusts the width of the BattleLog window.
 * Default: 816
 * @default 816
 *
 * @param Log Window Height
 * @desc Adjusts the height of the BattleLog window.
 * Default: 72
 * @default 72
 *
 * @param Log Window Align
 * @desc Sets the window alignment of the BattleLog window.
 * Settings: 0 = left, 1 = center, 2 = right
 * @default 1
 *
 * @param Show Icons
 * @desc Show skill and item icons when taking an action.
 * Settings: true for YES, false for NO
 * @default true
 *
 * @param Show Items
 * @desc Show item usage in the BattleLog.
 * Settings: true for YES, false for NO
 * @default true
 *
 * @param Base Delay
 * @desc Sets delay before showing battle animations from an action.
 * Default: 8 (Lower numbers equals less delay)
 * @default 8
 *
 * @param Next Delay
 * @desc Sets delay for battle animations to play between multiple targets. Default is 12. (Lower value equals less delay)
 * @default 12
 *
 * @param Opacity
 * @desc Sets the opacity of the BattleLog window. (0-255)
 * Default: 255
 * @default 255
 *
 * @param Back Opacity
 * @desc Sets the back opacity of the BattleLog window. (0-255)
 * Default: 255
 * @default 255
 *
 * @help
 * ============================================================================
 * About This Plugin
 * ============================================================================
 *
 * This plugin is a replacement for the default RPG Maker MV Battle Log window.
 * It will alter the behavior of the BattleLog in several ways, most notably
 * giving the Battle Log an opaque window, the option to show icons with skills,
 * and built-in omission of skills without a "use" message. There are also
 * several other customization options.
 *
 * The plugin, in its current state, gets rid of all of the BattleLog text
 * except the skill and item name when used. In future versions, more control
 * will be allowed to show more than just the skill/item names.
 *
 * Just place this plugin BELOW any other plugins that may alter the BattleLog
 * and you shouldn't have any issues.
 *
 * ============================================================================
 * Things To Know
 * ============================================================================
 *
 * - Any skill without a "use" message will hide the BattleLog for that skill
 *   entirely.
 * - Actor and enemy names are hidden when using a skill. Keep in mind that
 *   the best way to use this plugin is by simply inputting the name of the
 *   skill you're using or a custom message in the "use" input field.
 *
 *   i.e. "Fire" instead of "casts Fire"
 *
 * ============================================================================
 * Version History
 * ============================================================================
 *
 * 1.02 - November 8, 2015: Preliminary compatibility with Yanfly Engine
 *                          Battle Core.
 * 1.01 - November 6, 2015: Bugfix for icon displays.
 * 1.00 - November 6, 2015: Initial release.
 *
 */
 
//=============================================================================
// Parameter Variables
//=============================================================================
 
Coolie.Parameters = PluginManager.parameters('Coolie_FF_Battle_Log');
Coolie.Param = Coolie.Param || {};
 
Coolie.Param.LogWidth = Number(Coolie.Parameters['Log Window Width']);
Coolie.Param.LogHeight = Number(Coolie.Parameters['Log Window Height']);
Coolie.Param.LogWindowAlign = String(Coolie.Parameters['Log Window Align']);
Coolie.Param.ShowSkillIcons = String(Coolie.Parameters['Show Icons']);
Coolie.Param.ShowItems = String(Coolie.Parameters['Show Items']);
Coolie.Param.BaseDelay = Number(Coolie.Parameters['Base Delay']);
Coolie.Param.NextDelay = Number(Coolie.Parameters['Next Delay']);
Coolie.Param.Opacity = Number(Coolie.Parameters['Opacity']);
Coolie.Param.BackOpacity = Number(Coolie.Parameters['Back Opacity']);
 
//-----------------------------------------------------------------------------
// Window_BattleLog
//
// The window for displaying battle progress. No frame is displayed, but it is
// handled as a window for convenience.
 
function Window_BattleLog() {
    this.initialize.apply(this, arguments);
}
 
Window_BattleLog.prototype = Object.create(Window_Selectable.prototype);
Window_BattleLog.prototype.constructor = Window_BattleLog;
 
Window_BattleLog.prototype.initialize = function() {
    var width = this.windowWidth();
    var height = this.windowHeight();
    var w_align = Coolie.Param.LogWindowAlign;
    if (w_align == 0) {
        Window_Selectable.prototype.initialize.call(this, 0, 0, width, height);
    } else if (w_align == 1) {
        Window_Selectable.prototype.initialize.call(this, Graphics.boxWidth / 2 - width / 2, 0, width, height);
    } else if (w_align == 2) {
        Window_Selectable.prototype.initialize.call(this, Graphics.boxWidth - width, 0, width, height);
    }
    this.opacity = 0;
    this._lines = [];
    this._methods = [];
    this._waitCount = 0;
    this._waitMode = '';
    this._baseLineStack = [];
    this._spriteset = null;
    this.createBackBitmap();
    this.createBackSprite();
    this.refresh();
};
 
Window_BattleLog.prototype.setSpriteset = function(spriteset) {
    this._spriteset = spriteset;
};
 
Window_BattleLog.prototype.windowWidth = function() {
    return Coolie.Param.LogWidth; // WC: Width
};
 
Window_BattleLog.prototype.windowHeight = function() {
    return Coolie.Param.LogHeight; // WC: Height
};
 
Window_BattleLog.prototype.maxLines = function() {
    return 1; // WC: Max Lines (should always be 1)
};
 
Window_BattleLog.prototype.createBackBitmap = function() {
    this._backBitmap = new Bitmap(this.width, this.height);
};
 
Window_BattleLog.prototype.createBackSprite = function() {
    this._backSprite = new Sprite();
    this._backSprite.bitmap = this._backBitmap;
    this._backSprite.y = this.y;
    this.addChildToBack(this._backSprite);
};
 
Window_BattleLog.prototype.numLines = function() {
    return this._lines.length;
};
 
Window_BattleLog.prototype.messageSpeed = function() {
    return 16;
};
 
Window_BattleLog.prototype.isBusy = function() {
    return this._waitCount > 0 || this._waitMode || this._methods.length > 0;
};
 
Window_BattleLog.prototype.update = function() {
    if (!this.updateWait()) {
        this.callNextMethod();
    }
};
 
Window_BattleLog.prototype.updateWait = function() {
    return this.updateWaitCount() || this.updateWaitMode();
};
 
Window_BattleLog.prototype.updateWaitCount = function() {
    if (this._waitCount > 0) {
        this._waitCount -= this.isFastForward() ? 3 : 1;
        if (this._waitCount < 0) {
            this._waitCount = 0;
        }
        return true;
    }
    return false;
};
 
Window_BattleLog.prototype.updateWaitMode = function() {
        var waiting = false;
        if (Imported.YEP_BattleEngineCore = true) {
                switch (this._waitMode) {
        case 'effect':
        waiting = this._spriteset.isEffecting();
        break;
        case 'movement':
        waiting = this._spriteset.isAnyoneMoving();
        break;
                case 'animation':
        waiting = this._spriteset.isAnimationPlaying();
        break;
        case 'popups':
        waiting = this._spriteset.isPopupPlaying();
        break;
            }  
        } else {
                switch (this._waitMode) {
        case 'effect':
        waiting = this._spriteset.isEffecting();
        break;
        case 'movement':
        waiting = this._spriteset.isAnyoneMoving();
        break;
            }
        }
    if (!waiting) {
        this._waitMode = '';
    }
    return waiting;
};
 
Window_BattleLog.prototype.setWaitMode = function(waitMode) {
    this._waitMode = waitMode;
};
 
Window_BattleLog.prototype.callNextMethod = function() {
    if (this._methods.length > 0) {
        var method = this._methods.shift();
        if (method.name && this[method.name]) {
            this[method.name].apply(this, method.params);
        } else {
            throw new Error('Method not found: ' + method.name);
        }
    }
};
 
Window_BattleLog.prototype.isFastForward = function() {
    return (Input.isLongPressed('ok') || Input.isPressed('shift') ||
            TouchInput.isLongPressed());
};
 
Window_BattleLog.prototype.push = function(methodName) {
    var methodArgs = Array.prototype.slice.call(arguments, 1);
    this._methods.push({ name: methodName, params: methodArgs });
};
 
Window_BattleLog.prototype.clear = function() {
    this.opacity = 0; // WC: Resets Opacity
    this._lines = [];
    this._baseLineStack = [];
    this.refresh();
};
 
Window_BattleLog.prototype.wait = function() {
    this._waitCount = this.messageSpeed();
};
 
Window_BattleLog.prototype.waitForEffect = function() {
    this.setWaitMode('effect');
};
 
Window_BattleLog.prototype.waitForMovement = function() {
    this.setWaitMode('movement');
};
 
Window_BattleLog.prototype.waitForAnimation = function() {
    this.setWaitMode('animation');
};
 
Window_BattleLog.prototype.waitForPopups = function() {
    this.setWaitMode('popups');
};
 
Window_BattleLog.prototype.addText = function(text) {
    this._lines.push(text);
    this.refresh();
    this.wait();
};
 
Window_BattleLog.prototype.pushBaseLine = function() {
    this._baseLineStack.push(this._lines.length);
};
 
Window_BattleLog.prototype.popBaseLine = function() {
    var baseLine = this._baseLineStack.pop();
    while (this._lines.length > baseLine) {
        this._lines.pop();
    }
};
 
Window_BattleLog.prototype.waitForNewLine = function() {
    var baseLine = 0;
    if (this._baseLineStack.length > 0) {
        baseLine = this._baseLineStack[this._baseLineStack.length - 1];
    }
    if (this._lines.length > baseLine) {
        this.wait();
    }
};
 
Window_BattleLog.prototype.popupDamage = function(target) {
    target.startDamagePopup();
};
 
Window_BattleLog.prototype.performActionStart = function(subject, action) {
    subject.performActionStart(action);
};
 
Window_BattleLog.prototype.performAction = function(subject, action) {
    subject.performAction(action);
};
 
Window_BattleLog.prototype.performActionEnd = function(subject) {
    subject.performActionEnd();
};
 
Window_BattleLog.prototype.performDamage = function(target) {
    target.performDamage();
};
 
Window_BattleLog.prototype.performMiss = function(target) {
    target.performMiss();
};
 
Window_BattleLog.prototype.performRecovery = function(target) {
    target.performRecovery();
};
 
Window_BattleLog.prototype.performEvasion = function(target) {
    target.performEvasion();
};
 
Window_BattleLog.prototype.performMagicEvasion = function(target) {
    target.performMagicEvasion();
};
 
Window_BattleLog.prototype.performCounter = function(target) {
    target.performCounter();
};
 
Window_BattleLog.prototype.performReflection = function(target) {
    target.performReflection();
};
 
Window_BattleLog.prototype.performSubstitute = function(substitute, target) {
    substitute.performSubstitute(target);
};
 
Window_BattleLog.prototype.performCollapse = function(target) {
    target.performCollapse();
};
 
Window_BattleLog.prototype.showAnimation = function(subject, targets, animationId) {
    if (animationId < 0) {
        this.showAttackAnimation(subject, targets);
    } else {
        this.showNormalAnimation(targets, animationId);
    }
};
 
Window_BattleLog.prototype.showAttackAnimation = function(subject, targets) {
    if (subject.isActor()) {
        this.showActorAttackAnimation(subject, targets);
    } else {
        this.showEnemyAttackAnimation(subject, targets);
    }
};
 
Window_BattleLog.prototype.showActorAttackAnimation = function(subject, targets) {
    this.showNormalAnimation(targets, subject.attackAnimationId1(), false);
    this.showNormalAnimation(targets, subject.attackAnimationId2(), true);
};
 
Window_BattleLog.prototype.showEnemyAttackAnimation = function(subject, targets) {
    if (Imported.YEP_BattleEngineCore = true) {
                if ($gameSystem.isSideView()) {
                        this.showNormalAnimation(targets, subject.attackAnimationId(), false);
                } else {
      this.showNormalAnimation(targets, subject.attackAnimationId(), false);
                        Yanfly.BEC.Window_BattleLog_showEnemyAttackAnimation.call(this, subject,
                                        targets);
                }
        } else {
                SoundManager.playEnemyAttack();
        }
};
 
Window_BattleLog.prototype.showNormalAnimation = function(targets, animationId, mirror) {
    var animation = $dataAnimations[animationId];
    if (animation) {
        var delay = this.animationBaseDelay();
        var nextDelay = this.animationNextDelay();
        targets.forEach(function(target) {
            target.startAnimation(animationId, mirror, delay);
            delay += nextDelay;
        });
    }
};
 
Window_BattleLog.prototype.animationBaseDelay = function() {
        return Coolie.Param.BaseDelay;
};
 
Window_BattleLog.prototype.animationNextDelay = function() {
        return Coolie.Param.NextDelay;
};
 
Window_BattleLog.prototype.refresh = function() {
    this.drawBackground();
    this.contents.clear();
    for (var i = 0; i < this._lines.length; i++) {
        this.drawLineText(i);
    }
};
 
Window_BattleLog.prototype.drawBackground = function() {
    var rect = this.backRect();
    var color = this.backColor();
    this._backBitmap.clear();
    this._backBitmap.paintOpacity = this.backPaintOpacity();
    this._backBitmap.fillRect(rect.x, rect.y, rect.width, rect.height, color);
    this._backBitmap.paintOpacity = 255;
};
 
Window_BattleLog.prototype.backRect = function() {
    return {
        x: 0,
        y: this.padding,
        width: this.width,
        height: this.numLines() * this.lineHeight()
    };
};
 
Window_BattleLog.prototype.backColor = function() {
    return '#000000';
};
 
Window_BattleLog.prototype.backPaintOpacity = function() {
    return 0; // WC: Back Paint Opacity
};
 
Window_BattleLog.prototype.drawLineText = function(index) {
    var rect = this.itemRectForText(index);
    this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
    this.drawTextEx(this._lines[index], rect.x, rect.y, rect.width);
};
 
Window_BattleLog.prototype.startTurn = function() {
    this.push('wait');
};
 
Window_BattleLog.prototype.startAction = function(subject, action, targets) {
        if (Imported.YEP_BattleEngineCore != true) {
                var item = action.item();
        this.push('performActionStart', subject, action);
        this.push('waitForMovement');
        this.push('performAction', subject, action);
        this.push('showAnimation', subject, targets.clone(), item.animationId);
        this.displayAction(subject, item);
        }
};
 
Window_BattleLog.prototype.endAction = function(subject) {
    if (Imported.YEP_BattleEngineCore != true) {
                this.push('waitForNewLine');
        this.push('clear');
        this.push('performActionEnd', subject);
        }
};
 
Window_BattleLog.prototype.displayCurrentState = function(subject) {
    var stateText = subject.mostImportantStateText();
    if (stateText) {
        // this.push('addText', subject.name() + stateText);
        this.push('wait');
        this.push('clear');
    }
};
 
Window_BattleLog.prototype.displayRegeneration = function(subject) {
    this.push('popupDamage', subject);
};
 
Window_BattleLog.prototype.displayAction = function(subject, item) {
    var numMethods = this._methods.length;
    var width = this.windowWidth();
    var show_skill_icons = Coolie.Param.ShowSkillIcons;
    var show_items = Coolie.Param.ShowItems;
    if (DataManager.isItem(item)) { // Show item usage with icon
        if (show_items == 'false') { // WC: Hide log when Show Items is false
        }
        if (show_items == 'true' && show_skill_icons == 'false') { // WC: Show log with item name only
            this.opacity = Coolie.Param.Opacity; // WC: Opacity
            this.drawText(item.name.format(item.name), 0, 0, width - 32, 'center');
        }
        if (show_items == 'true' && show_skill_icons == 'true' && item.iconIndex > 0) { // WC: Show log with item name and icon
            this.opacity = Coolie.Param.Opacity; // WC: Opacity
            var icon_x = this.windowWidth() / 2 - this.textWidth(item.name) / 2;
            this.drawIcon(item.iconIndex, icon_x - 32, 0);
            this.drawText(item.name.format(item.name), 0, 0, width, 'center');
        }
    }
    if (DataManager.isSkill(item)) {
    if (!item.message1) { // WC: Hide log when use message is empty
    }
    if (item.message1) { // WC: Show log
        this.opacity = Coolie.Param.Opacity; // WC: Opacity
        var icon_x = this.windowWidth() / 2 - this.textWidth(item.message1) / 2;
        if (show_skill_icons == 'true' && item.iconIndex > 0) { // WC: Show skill use message and icon
            this.drawIcon(item.iconIndex, icon_x - 32, 0);
            this.drawText(item.message1.format(item.name), 0, 0, width, 'center');
        } else { // WC: Only show skill use message
            this.drawText(item.message1.format(item.name), 0, 0, width - 32, 'center');
        }
    }
    }
    if (this._methods.length === numMethods) {
        this.push('wait');
    }
};
 
Window_BattleLog.prototype.displayCounter = function(target) {
    this.push('performCounter', target);
    // this.push('addText', TextManager.counterAttack.format(target.name()));
};
 
Window_BattleLog.prototype.displayReflection = function(target) {
    this.push('performReflection', target);
    // this.push('addText', TextManager.magicReflection.format(target.name()));
};
 
Window_BattleLog.prototype.displaySubstitute = function(substitute, target) {
    var substName = substitute.name();
    this.push('performSubstitute', substitute, target);
    // this.push('addText', TextManager.substitute.format(substName, target.name()));
};
 
Window_BattleLog.prototype.displayActionResults = function(subject, target) {
    if (target.result().used) {
        this.push('pushBaseLine');
        this.displayCritical(target);
        this.push('popupDamage', target);
        this.push('popupDamage', subject);
        this.displayDamage(target);
        this.displayAffectedStatus(target);
        this.displayFailure(target);
        this.push('waitForNewLine');
        this.push('popBaseLine');
                this.push('clear'); // WC: Clear
    }
};
 
Window_BattleLog.prototype.displayFailure = function(target) {
    if (target.result().isHit() && !target.result().success) {
        // this.push('addText', TextManager.actionFailure.format(target.name()));
    }
};
 
Window_BattleLog.prototype.displayCritical = function(target) {
    if (target.result().critical) {
        if (target.isActor()) {
            // this.push('addText', TextManager.criticalToActor);
        } else {
            // this.push('addText', TextManager.criticalToEnemy);
        }
    }
};
 
Window_BattleLog.prototype.displayDamage = function(target) {
    if (target.result().missed) {
        this.displayMiss(target);
    } else if (target.result().evaded) {
        this.displayEvasion(target);
    } else {
        this.displayHpDamage(target);
        this.displayMpDamage(target);
        this.displayTpDamage(target);
    }
};
 
Window_BattleLog.prototype.displayMiss = function(target) {
    var fmt;
    if (target.result().physical) {
        fmt = target.isActor() ? TextManager.actorNoHit : TextManager.enemyNoHit;
        this.push('performMiss', target);
    } else {
        fmt = TextManager.actionFailure;
    }
    // this.push('addText', fmt.format(target.name()));
};
 
Window_BattleLog.prototype.displayEvasion = function(target) {
    var fmt;
    if (target.result().physical) {
        fmt = TextManager.evasion;
        this.push('performEvasion', target);
    } else {
        fmt = TextManager.magicEvasion;
        this.push('performMagicEvasion', target);
    }
    // this.push('addText', fmt.format(target.name()));
};
 
Window_BattleLog.prototype.displayHpDamage = function(target) {
    if (target.result().hpAffected) {
        if (target.result().hpDamage > 0 && !target.result().drain) {
            this.push('performDamage', target);
        }
        if (target.result().hpDamage < 0) {
            this.push('performRecovery', target);
        }
        // this.push('addText', this.makeHpDamageText(target));
    }
};
 
Window_BattleLog.prototype.displayMpDamage = function(target) {
    if (target.isAlive() && target.result().mpDamage !== 0) {
        if (target.result().mpDamage < 0) {
            this.push('performRecovery', target);
        }
        // this.push('addText', this.makeMpDamageText(target));
    }
};
 
Window_BattleLog.prototype.displayTpDamage = function(target) {
    if (target.isAlive() && target.result().tpDamage !== 0) {
        if (target.result().tpDamage < 0) {
            this.push('performRecovery', target);
        }
        // this.push('addText', this.makeTpDamageText(target));
    }
};
 
Window_BattleLog.prototype.displayAffectedStatus = function(target) {
    if (target.result().isStatusAffected()) {
        this.push('pushBaseLine');
        this.displayChangedStates(target);
        this.displayChangedBuffs(target);
        this.push('waitForNewLine');
        this.push('popBaseLine');
    }
};
 
Window_BattleLog.prototype.displayAutoAffectedStatus = function(target) {
    if (target.result().isStatusAffected()) {
        this.displayAffectedStatus(target, null);
        this.push('clear');
    }
};
 
Window_BattleLog.prototype.displayChangedStates = function(target) {
    this.displayAddedStates(target);
    this.displayRemovedStates(target);
};
 
Window_BattleLog.prototype.displayAddedStates = function(target) {
    target.result().addedStateObjects().forEach(function(state) {
        var stateMsg = target.isActor() ? state.message1 : state.message2;
        if (state.id === target.deathStateId()) {
            this.push('performCollapse', target);
        }
        if (stateMsg) {
            this.push('popBaseLine');
            this.push('pushBaseLine');
            // this.push('addText', target.name() + stateMsg);
            this.push('waitForEffect');
        }
    }, this);
};
 
Window_BattleLog.prototype.displayRemovedStates = function(target) {
    target.result().removedStateObjects().forEach(function(state) {
        if (state.message4) {
            this.push('popBaseLine');
            this.push('pushBaseLine');
            // this.push('addText', target.name() + state.message4);
        }
    }, this);
};
 
Window_BattleLog.prototype.displayChangedBuffs = function(target) {
    var result = target.result();
    this.displayBuffs(target, result.addedBuffs, TextManager.buffAdd);
    this.displayBuffs(target, result.addedDebuffs, TextManager.debuffAdd);
    this.displayBuffs(target, result.removedBuffs, TextManager.buffRemove);
};
 
Window_BattleLog.prototype.displayBuffs = function(target, buffs, fmt) {
    buffs.forEach(function(paramId) {
        this.push('popBaseLine');
        this.push('pushBaseLine');
        // this.push('addText', fmt.format(target.name(), TextManager.param(paramId)));
    }, this);
};
 
Window_BattleLog.prototype.makeHpDamageText = function(target) {
    var result = target.result();
    var damage = result.hpDamage;
    var isActor = target.isActor();
    var fmt;
    if (damage > 0 && result.drain) {
        fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
        return fmt.format(target.name(), TextManager.hp, damage);
    } else if (damage > 0) {
        fmt = isActor ? TextManager.actorDamage : TextManager.enemyDamage;
        return fmt.format(target.name(), damage);
    } else if (damage < 0) {
        fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
        return fmt.format(target.name(), TextManager.hp, -damage);
    } else {
        fmt = isActor ? TextManager.actorNoDamage : TextManager.enemyNoDamage;
        return fmt.format(target.name());
    }
};
 
Window_BattleLog.prototype.makeMpDamageText = function(target) {
    var result = target.result();
    var damage = result.mpDamage;
    var isActor = target.isActor();
    var fmt;
    if (damage > 0 && result.drain) {
        fmt = isActor ? TextManager.actorDrain : TextManager.enemyDrain;
        return fmt.format(target.name(), TextManager.mp, damage);
    } else if (damage > 0) {
        fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
        return fmt.format(target.name(), TextManager.mp, damage);
    } else if (damage < 0) {
        fmt = isActor ? TextManager.actorRecovery : TextManager.enemyRecovery;
        return fmt.format(target.name(), TextManager.mp, -damage);
    } else {
        return '';
    }
};
 
Window_BattleLog.prototype.makeTpDamageText = function(target) {
    var result = target.result();
    var damage = result.tpDamage;
    var isActor = target.isActor();
    var fmt;
    if (damage > 0) {
        fmt = isActor ? TextManager.actorLoss : TextManager.enemyLoss;
        return fmt.format(target.name(), TextManager.tp, damage);
    } else if (damage < 0) {
        fmt = isActor ? TextManager.actorGain : TextManager.enemyGain;
        return fmt.format(target.name(), TextManager.tp, -damage);
    } else {
        return '';
    }
};