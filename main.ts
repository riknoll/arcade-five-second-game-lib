
//% block="Game Jam"
//% weight=999999
//% color="#3246a8"
namespace GameJam {
    const TOTAL_TIME = 5000;
    let _startTime: number;
    let _verb: string;
    let _isGameOver: boolean;
    let _didTheySucceed: boolean;
    let registeredGames: RegisteredGame[] = [];

    class RegisteredGame {
        constructor(public verb: string, public main: () => void) { }
    }

    enum ResetState {
        Playing,
        Won,
        Lost,
    }

    //% blockId=gamejam_gameover
    //% block="set mini game win state $success"
    //% weight=90
    export function setSuccess(success: boolean) {
        _isGameOver = true;
        _didTheySucceed = success;
    }

    //% blockId=gamejam_didTheySucceed
    //% block="did they win?"
    //% weight=60
    export function didTheySucceed(): boolean {
        return !!(_didTheySucceed);
    }

    //% blockId=gamejam_isMiniGameOver
    //% block="is mini game over?"
    //% weight=70
    export function isMiniGameOver(): boolean {
        return !!(_isGameOver);
    }

    //% blockId=gamejam_millisRemaining
    //% block="milliseconds remaining in game"
    //% weight=80
    export function millisRemaining(): number {
        return TOTAL_TIME - (control.millis() - _startTime);
    }

    //% blockId=gamejam_startMiniGame
    //% block="start mini game with verb $verb"
    //% weight=100
    export function startMiniGame(verb: string) {
        _startTime = game.runtime();
        _verb = verb;
        settings.writeNumber("resetState", ResetState.Playing)

        startTimerDraw();

        setTimeout(() => {
            if (_didTheySucceed) {
                settings.writeNumber("resetState", ResetState.Won)
            }
            else {
                settings.writeNumber("resetState", ResetState.Lost)
            }
            game.reset();
        }, TOTAL_TIME);
    }

    export function init() {
        const state = settings.readNumber("resetState") || ResetState.Playing;
        let gameIndex = settings.readNumber("gameIndex") || 0;

        if (state === ResetState.Lost) {
            // show "let's try that again"
        }
        else if (state === ResetState.Won) {
            gameIndex++;

            if (gameIndex === registeredGames.length) {
                // show victory
                gameIndex = 0;
            }
        }
        else {
            gameIndex = 0;
        }

        settings.writeNumber("gameIndex", gameIndex);

        if (registeredGames[gameIndex]) {
            registeredGames[gameIndex].main();
        }
    }

    export function registerGame(verb: string, main: () => void) {
        registeredGames.push(new RegisteredGame(verb, main));
    }

    function startTimerDraw() {
        const numbers = [img`
a a a a a a 
a a a a a a 
a a . . . . 
a a a a a . 
a a a a a a 
. . . . a a 
. . . . a a 
a a a a a a 
a a a a a . 
`, img`
a a . . a a 
a a . . a a 
a a . . a a 
a a . . a a 
a a a a a a 
. a a a a a 
. . . . a a 
. . . . a a 
. . . . a a 
`, img`
. a a a a . 
a a a a a a 
a a . . a a 
. . . . a a 
. . a a a . 
. . . . a a 
a a . . a a 
a a a a a a 
. a a a a . 
`, img`
. a a a a . 
a a a a a a 
a a . . a a 
. . . a a a 
. . a a a . 
. a a a . . 
a a a . . . 
a a a a a a 
a a a a a a 
`, img`
. a a a . . 
a a a a . . 
a a a a . . 
. . a a . . 
. . a a . . 
. . a a . . 
. . a a . . 
a a a a a a 
a a a a a a 
`];

        const OUTLINE = 15;
        const EMPTYFILL = 1;
        const FILL = 2;

        const fillNumbers = numbers.map(n => {
            const t = n.clone();
            t.replace(0xa, FILL)
            return t;
        })

        const emptyNumbers = numbers.map(n => {
            const t = n.clone();
            t.replace(0xa, EMPTYFILL)
            return t;
        })

        const CIRCLE_WIDTH = 13;
        const BAR_WIDTH = 143;
        const TOTAL_WIDTH = CIRCLE_WIDTH + BAR_WIDTH;
        let renderImage = image.create(CIRCLE_WIDTH, CIRCLE_WIDTH);

        game.onShade(() => {
            const percentage = millisRemaining() / TOTAL_TIME;
            const filledWidth = (TOTAL_WIDTH * percentage) | 0;

            // Draw the bulb
            screen.fillCircle(8, 111, 8, OUTLINE)
            screen.fillCircle(8, 111, 7, EMPTYFILL)

            // Draw the bar
            screen.drawRect(15, 108, 143, 7, OUTLINE)
            screen.fillRect(15, 109, 143, 5, EMPTYFILL)
            screen.fillRect(15, 109, filledWidth - CIRCLE_WIDTH, 5, FILL)

            // Draw a couple extra pixels so that it looks like the meniscus on a graduated cylinder
            if (filledWidth > CIRCLE_WIDTH) {
                screen.fillRect(15 + filledWidth - CIRCLE_WIDTH, 109, 1, 1, FILL)
                screen.fillRect(15 + filledWidth - CIRCLE_WIDTH, 113, 1, 1, FILL)
            }

            // Round off the bar
            screen.fillRect(158, 109, 1, 5, OUTLINE)

            // First draw the number in the fill color
            const numIndex = Math.max(Math.min(numbers.length - 1 - Math.idiv(millisRemaining(), 1000), numbers.length - 1), 0);
            screen.drawTransparentImage(fillNumbers[numIndex], 5, 107)

            // Then draw the partially filled bulb and inverted number on top
            const offset = Math.max(CIRCLE_WIDTH - filledWidth, 0)
            renderImage.fill(0)
            renderImage.fillCircle((CIRCLE_WIDTH >> 1) + offset, (CIRCLE_WIDTH >> 1), 7, FILL)
            renderImage.drawTransparentImage(emptyNumbers[numIndex], 3 + offset, 2)
            screen.drawTransparentImage(renderImage, 2 - offset, 105)

            // Draw the tick marks on the bar
            for (let i = 0; i < BAR_WIDTH; i += 11) {
                screen.fillRect(20 + i, 112, 1, 2, 15)
            }
        })
    }
}

GameJam.init();