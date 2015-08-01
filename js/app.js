var image = new Image();
image.onload = function () {
    var rainDropScene = new RainDropScene("canvas", image);
}
image.src = './images/city.jpg';

function RainDropScene(canvas, image) {
    this.width = image.width;
    this.height = image.height;
    this.stage = new createjs.Stage(canvas);
    this.image = image;
    this.oldPt = null;//旧位置点
    this.oldMidPt = null;//旧中间点
    this.isDrawing = false;//鼠标是否按下,是否处于擦除状态
    this.raindrops = [];//所有雨滴
    this.init();
}

RainDropScene.prototype.init = function () {
    createjs.Touch.enable(this.stage);
    this.stage.enableMouseOver();
    this.initBlurLayer();
    this.initMaskLayer();
    this.initRainLayer();
    this.bindEvents();
    this.stage.update();
}

//初始化'模糊图片层',垫在最下面
RainDropScene.prototype.initBlurLayer = function () {
    this.blurLayer = new createjs.Bitmap(image);
    this.blurLayer.filters = [new createjs.BlurFilter(15, 15, 2), new createjs.ColorMatrixFilter(new createjs.ColorMatrix(60))];
    this.blurLayer.cache(0, 0, this.width, this.height);
    this.stage.addChild(this.blurLayer);
}

//初始化'擦除层',倒数第二层
RainDropScene.prototype.initMaskLayer = function () {
    this.maskLayer = new createjs.Bitmap(image);
    this.maskLayer.cache(0, 0, this.width, this.height);
    this.maskLayer.drawingCanvas = new createjs.Shape();
    this.maskLayer.drawingCanvas.cache(0, 0, this.width, this.height);
    this.stage.addChild(this.maskLayer);
    this.updateMaskLayer();
}

//更新'擦除层'
RainDropScene.prototype.updateMaskLayer = function () {
    this.maskLayer.drawingCanvas.updateCache();
    var maskFilter = new createjs.AlphaMaskFilter(this.maskLayer.drawingCanvas.cacheCanvas);
    this.maskLayer.filters = [new createjs.AlphaMaskFilter(this.maskLayer.drawingCanvas.cacheCanvas)];
    this.maskLayer.updateCache(0, 0, this.width, this.height);
    this.stage.update();
}

//初始化'雨滴层',最上面一层
RainDropScene.prototype.initRainLayer = function () {
    this.rainLayer = new createjs.Bitmap(image);
    this.rainLayer.cache(0, 0, this.width, this.height);
    this.rainLayer.regX = this.width / 2;
    this.rainLayer.regY = this.height / 2;
    this.rainLayer.x = this.width / 2;
    this.rainLayer.y = this.height / 2;
    this.rainLayer.rotation = 180;
    this.rainLayer.drawingCanvas = new createjs.Shape();
    this.rainLayer.drawingCanvas.cache(0, 0, this.width, this.height);
    this.stage.addChild(this.rainLayer);
}

//更新'雨滴层'
RainDropScene.prototype.updateRainLayer = function () {
    this.rainLayer.drawingCanvas.updateCache();
    var maskFilter = new createjs.AlphaMaskFilter(this.rainLayer.drawingCanvas.cacheCanvas);
    this.rainLayer.filters = [new createjs.AlphaMaskFilter(this.rainLayer.drawingCanvas.cacheCanvas)];
    this.rainLayer.updateCache();
    this.stage.update();

}

RainDropScene.prototype.bindEvents = function () {
    this.stage.addEventListener("stagemousedown", createjs.proxy(this.mousedownHandler, this));
    this.stage.addEventListener("stagemouseup", createjs.proxy(this.mouseupHandler, this));
    this.stage.addEventListener("stagemousemove", createjs.proxy(this.mousemoveHandler, this));

    createjs.Ticker.setFPS(20);
    createjs.Ticker.addEventListener("tick", createjs.proxy(this.drawRainDrop, this));


}

RainDropScene.prototype.mousedownHandler = function (event) {
    this.oldPt = new createjs.Point(this.stage.mouseX, this.stage.mouseY);
    this.oldMidPt = this.oldPt;
    this.isDrawing = true;
}

RainDropScene.prototype.mouseupHandler = function (event) {
    this.isDrawing = false;
}

RainDropScene.prototype.mousemoveHandler = function (event) {
    if (!this.isDrawing) {
        return;
    }
    var midPoint = new createjs.Point(this.oldPt.x + this.stage.mouseX >> 1, this.oldPt.y + this.stage.mouseY >> 1);
    this.maskLayer.drawingCanvas.graphics.setStrokeStyle(40, "round", "round").beginStroke("rgba(0,0,0,0.05)").moveTo(midPoint.x, midPoint.y)
        .curveTo(this.oldPt.x, this.oldPt.y, this.oldMidPt.x, this.oldMidPt.y);
    this.oldPt.x = this.stage.mouseX;
    this.oldPt.y = this.stage.mouseY;
    this.oldMidPt.x = midPoint.x;
    this.oldMidPt.y = midPoint.y;
    this.updateMaskLayer();
}

RainDropScene.prototype.drawRainDrop = function (event) {
    //清空上次绘制
    this.rainLayer.drawingCanvas.graphics.clear();
    //绘制位置变化过的雨滴
    for (var l = 0; l < this.raindrops.length; l++) {
        var drop = this.raindrops[l];
        if (drop.goDown()) {
            this.rainLayer.drawingCanvas.graphics.beginFill("rgba(255,255,255,1)").drawCircle(drop.x, this.height - drop.y, drop.radius);
        } else {
            this.raindrops.splice(l, 1);
            l--;
        }
    }

    //再添加新的雨滴
    if (createjs.Ticker.getTicks() % 20 === 0) {
        var newDrop = new RainDrop(0, this.width, 0, this.height, 3, 8);
        this.raindrops.push(newDrop);
    }
    this.updateRainLayer();
}


function RainDrop(minX, maxX, minY, maxY, minRadius, maxRadius) {
    this.minX = minX || 0;
    this.maxX = maxX || 900;
    this.minY = minY || 0;
    this.maxY = maxY || 600;
    this.minRadius = minRadius || 2;
    this.maxRadius = maxRadius || 5;
    this.initShape();

}

RainDrop.prototype.initShape = function () {
    this.x = Math.floor(Math.random() * (this.maxX - this.minX));
    this.y = Math.floor(Math.random() * (this.maxY - this.minY));
    this.radius = Math.floor(Math.random() * (this.maxRadius - this.minRadius));
}

RainDrop.prototype.goDown = function () {
    this.y += .4;
    if (this.y > this.maxY) {
        return false;
    } else {
        return true;
    }
}