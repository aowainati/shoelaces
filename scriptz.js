$(document).ready(function () {
    /**
     * Class to represent the complete state of the game.
     */
    function GameState () {
        this.keys_down = {};
        this.objects = [];
    }

    /**
     * Initializes any necessary event handlers that interact with the game state.
     */
    GameState.prototype.initHandlers = function () {
        var keys_down = this.keys_down;
        addEventListener("keydown",
                         function (e) {
                             keys_down[e.keyCode] = true;
                         },
                         false);

        addEventListener("keyup",
                         function (e) {
                             delete keys_down[e.keyCode];
                         },
                         false);

        addEventListener("touchstart",
                         function (e) {
                             e.preventDefault();
                             keys_down[39] = true;
                             keys_down[40] = true;
                         },
                         false);

        addEventListener("touchend",
                         function (e) {
                             e.preventDefault();
                             delete keys_down[39];
                             delete keys_down[40];
                         },
                         false);

    };

    /**
     * Initializes objects in the game_state.
     */
    GameState.prototype.initObjects = function () {
        game_state.addObject(new Background(0, 0,
                                            2560, 1600,
                                            0, 0,
                                            "img/smb-bg.jpg"));
        game_state.addObject(new Megaman(CANVAS_X_MID, CANVAS_Y_MID));
        game_state.addObject(new Met(CANVAS_X_MID + 7, CANVAS_Y_MID - 17));
    }

    /**
     * Updates the game state based on time passed plus user input.
     */
    GameState.prototype.update = function (delta) {
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].update(delta, this.keys_down);
        }
    };

    /**
     * Renders the game state to the canvas.
     */
    GameState.prototype.render = function (ctx) {
        // TODO : make the BG rendering cleaner
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].render(ctx);
        }
    };

    /**
     * Adds an object to the game state.
     */
    GameState.prototype.addObject = function (object) {
        this.objects.push(object);
    };


    /**
     * Class to represent a renderable object in the game world.
     */
    function GameObject () {}

    /**
     * Updates the object based on time passed plus user input.
     */
    GameObject.prototype.update = function (delta, keys_down) {
        // Do nothing, child objects implement their own updates
    };

    /**
     * Renders the object to the screen.
     */
    GameObject.prototype.render = function (image_data) {
        // Do nothing, child objects implement their own updates
    };


    /**
     * Simple pixel object for testing, inherits from GameObject.
     */
    function Pixel (x, y, r, g, b, a) {
        GameObject.call(this);
        this.x = x;
        this.y = y;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    Pixel.prototype = new GameObject();
    Pixel.prototype.constructor = Pixel;

    Pixel.prototype.warpColor = function () {
        this.r = Math.ceil(Math.random() * 255);
        this.g = Math.ceil(Math.random() * 255);
        this.b = Math.ceil(Math.random() * 255);
    }

    Pixel.prototype.update = function (delta, keys_down) {
        this.warpColor();
    }

    Pixel.prototype.render = function (ctx) {
        var image_data = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

        index = (this.x + this.y * image_data.width) * 4;
        image_data.data[index] = this.r;
        image_data.data[index+1] = this.g;
        image_data.data[index+2] = this.b;
        image_data.data[index+3] = this.a;

        ctx.putImageData(image_data, 0, 0);
    }


    /**
     * GameObject backed by an image sprite.
     * x, y: coordinates of the sprite's location on the canvas, top-left anchored
     * w, h: width and height of the sprite (can vary if animated)
     * sx, sy: coordinates of the sprite on the spritesheet, top-left anchored
     * src: path to spritesheet
     */
    function Sprite (x, y, w, h, sx, sy, src) {
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.sx = sx; this.sy = sy;
        this.src = src;
        this.ready = false;

        // Inheriting from this class will make an unnecessary image call
        // with undefined as a src
        if (!(src === undefined)) {
            // Lambda'd, HARD.
            this.onload_handler = function () {
                var sprite_obj = this;
                return function () {
                    sprite_obj.ready = true;
                }
            }

            this.img_obj = new Image();
            this.img_obj.onload = this.onload_handler();
            this.img_obj.src = src;
        }
    }

    Sprite.prototype = new GameObject();
    Sprite.prototype.constructor = Sprite;

    Sprite.prototype.update = function (delta, keys_down) {
        // Implemented by child classes, should update animation state
        // (if applicable) and/or respond to user input.
        // Updating animation state includes modifying location, dimension,
        // and sprite coords.
    }

    Sprite.prototype.render = function (ctx) {
/*        // TODO : remove this debug rectangle
        ctx.strokeStyle = "red";
        ctx.strokeRect(this.x - 1, this.y - 1,
                       this.w + 2, this.h + 2); */

        if (this.ready) {
            ctx.drawImage(this.img_obj,
                          this.sx, this.sy,
                          this.w, this.h,
                          this.x, this.y,
                          this.w, this.h);
        }
    }

    Sprite.prototype.log = function () {
        console.log("SRC: " + this.src,
                    "X: " + this.x,
                    " Y: " + this.y,
                    " W: " + this.w,
                    " H: " + this.h,
                    " SX: " + this.sx,
                    " SY: " + this.sy);
    }


    /**
     * GameObject to represent the background.
     */
    function Background (x, y, w, h, sx, sy, src) {
        Sprite.call(this,
                    x, y,
                    w, h,
                    sx, sy,
                    src);

        this.scroll_rate = 5.0;

    }

    Background.prototype = new Sprite();
    Background.prototype.constructor = Background;

    Background.prototype.update = function (delta, keys_down) {
        var modifier = Math.ceil(delta / 24);
        var distance = modifier * this.scroll_rate;

        // Left
        if (keys_down[37]) {
            this.x = Math.min(this.x + distance,
                              0);
        }
        // Right
        if (keys_down[39]) {
            this.x = Math.max(this.x - distance,
                              CANVAS_WIDTH - this.w);
        }
        // Up
        if (keys_down[38]) {
            this.y = Math.min(this.y + distance,
                              0);
        }
        // Down
        if (keys_down[40]) {
            this.y = Math.max(this.y - distance,
                              CANVAS_HEIGHT - this.h);
        }
    }


    /** 
     * Class for Met.
     */
    function Met (x, y) {
        Sprite.call(this,
                    x, y,
                    20, 20,
                    60, 16,
                    "img/mm-enemies.png");

        this.anim_state = "walking";
        this.anim_seq_num = 0;

        this.animations = {
            "neutral": [ { "w": 20, "h": 20, "sx": 60, "sy": 16 } ],
            "walking": [ { "w": 20, "h": 20, "sx": 79, "sy": 16 },
                         { "w": 20, "h": 20, "sx": 56, "sy": 16 },
                         { "w": 20, "h": 20, "sx": 103, "sy": 16 },
                         { "w": 20, "h": 20, "sx": 56, "sy": 16 } ]
        };
    }

    Met.prototype = new Sprite();
    Met.prototype.constructor = Met;

    Met.prototype.update = function (delta, keys_down) {
        this.anim_seq_num += .4;
        var cur_loop = this.animations[this.anim_state];
        var anim_coords = cur_loop[(Math.floor(this.anim_seq_num)) % cur_loop.length];
        this.w = anim_coords["w"]; this.h = anim_coords["h"];
        this.sx = anim_coords["sx"]; this.sy = anim_coords["sy"];
    };

    /**
     * Class for Megaman.
     */
    function Megaman (x, y) {
        Sprite.call(this,
                    x, y,
                    40, 35,
                    212, 17,
                    "img/x-r.gif");

        this.facing = "r";
        this.anim_state = "neutral";
        this.anim_seq_num = 0;

        this.animations = {
            "neutral": [ { "w": 30, "h": 35, "sx": 213, "sy": 17 } ],
            "dash": [ { "w": 30, "h": 35, "sx": 285, "sy": 123 },
                      { "w": 42, "h": 35, "sx": 315, "sy": 123 } ]
        };
    }

    Megaman.prototype = new Sprite();
    Megaman.prototype.constructor = Megaman;

    Megaman.prototype.update = function (delta, keys_down) {
        var modifier = Math.ceil(delta / 24);

        if (keys_down[37] ||
            keys_down[38] ||
            keys_down[39] ||
            keys_down[40]) {
            if (this.anim_state === "neutral") {
                this.anim_state = "dash";
            } else if (this.anim_state === "dash") {
                this.anim_seq_num = Math.min(this.anim_seq_num + 1, 1);
            }
        } else {
            if (this.anim_state === "dash") {
                if (this.anim_seq_num == 0) {
                    this.anim_state = "neutral";
                } else {
                    this.anim_seq_num = Math.max(this.anim_seq_num - 1, 0);
                }
            }
        }

        var anim_coords = this.animations[this.anim_state][this.anim_seq_num];
        this.w = anim_coords["w"]; this.h = anim_coords["h"];
        this.sx = anim_coords["sx"]; this.sy = anim_coords["sy"];

/*        // Left
        if (keys_down[37]) {
            this.x = Math.max(this.x - modifier * 2, 0);
            this.facing = "l";
        }
        // Right
        if (keys_down[39]) {
            this.x = Math.min(this.x + modifier * 2, CANVAS_WIDTH - this.w);
            this.facing = "r";
        }
        // Up
        if (keys_down[38]) {
            this.y = Math.max(this.y - modifier * 2, 0);
        }
        // Down
        if (keys_down[40]) {
            this.y = Math.min(this.y + modifier * 2, CANVAS_HEIGHT - this.h);
        }
*/
    };


    /**
     * The main game loop.
     */
    var main = function () {
        var now = Date.now();
        var delta = now - then;

        game_state.update(delta);
        game_state.render(global_canvas_ctx);

        if (loop_count == 24) {
            var fps = 1000.0 / delta;
            $("#the_fps_counter").html("FPS: " + fps.toString());
            loop_count = 0;
        }

        then = now;
        loop_count++;
    };


    // Pull out the canvas vars
    var global_canvas = document.getElementById("the_game");
    var global_canvas_ctx = global_canvas.getContext("2d");
    var CANVAS_WIDTH = global_canvas.width;
    var CANVAS_HEIGHT = global_canvas.height;
    var CANVAS_Y_MID = CANVAS_HEIGHT / 2.0;
    var CANVAS_X_MID = CANVAS_WIDTH / 2.0;

    // Initialize the game state
    window.game_state = new GameState();
    game_state.initHandlers();
    game_state.initObjects();

    // Set some nasty global variables and GOOOOO
    var then = Date.now();
    var loop_count = 0;
    setInterval(main, 41);
});