-- Initializes the virtual screen of the current node. The variables NATIVE_WIDTH and NATIVE_HEIGHT
-- contain the native screen width
gl.setup(1024, 768)

-- Setup an image variable to hold the name of the image coming in from node js
local visibleObject = resource.load_image "beamer.png"
local TYPE_IMAGE_1  = '.JPEG'
local TYPE_IMAGE_2  = '.png'
local TYPE_VIEO     = '.mp4'

function readln()
    return coroutine.yield()
end

if not N.clients then
    N.clients = {}
end

node.event("connect", function(client)
    local handler = coroutine.wrap(echo)
    N.clients[client] = handler
end)

node.event("input", function(line, client)
    N.clients[client](line)
end)

node.event("disconnect", function(client)
    N.clients[client] = nil
end)

function echo(print)
    while true do
        -- Read a line of content coming in from nodejs server
        -- local line = readln()
        -- local line = "VID_20180204_192705.mp4"
        local line = "beamer.png"
        -- We know the line coming in is either an image name or a video. Save it in the visibleObject
        -- variable declared earlier.
        -- This image/video variable will now be used  in node.render()

        -- Check if content is IMAGE
        if(string.find(line, TYPE_IMAGE_1) ~= nil)
            then
                print("Detected Visual is an Image")
                visibleObject = resource.load_image(line)
            end

        -- Check if content is IMAGE
        if(string.find(line, TYPE_IMAGE_2) ~= nil)
            then
                print("Detected Visual is an Image")
                visibleObject = resource.load_image(line)
            end

        -- Check if content is VIDEO
        if(string.find(line, TYPE_VIEO) ~= nil)
            then
                visibleObject = resource.load_video {
                    file = line;
                    looped = false;
                    audio = true;
                    paused = false;
                }
            end
    end
end

-- node.render is called for each frame so the moment a new image name comes in, it'll be replaced
function node.render()
    gl.clear(1, 1, 1, 1)
    util.draw_correct(visibleObject, 0, 0, WIDTH, HEIGHT)
end
