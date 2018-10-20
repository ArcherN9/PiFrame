-- Initializes the virtual screen of the current node. The variables NATIVE_WIDTH and NATIVE_HEIGHT
-- contain the native screen width
gl.setup(NATIVE_WIDTH, NATIVE_HEIGHT)

-- Setup an image variable to hold the name of the image coming in from node js
local visibleObject = ''
local TYPE_IMAGE_1  = '.JPEG'
local TYPE_IMAGE_2  = '.png'
local TYPE_VIEO     = '.mp4'

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
        local line = readln()
        -- We know the line coming in is either an image name or a video. Save it in the visibleObject
        -- variable declared earlier.
        -- This image/video variable will now be used  in node.render()

        -- Check if content is IMAGE
        if(string.find(line, TYPE_IMAGE_1) ~= nil)
            then
                visibleObject = resource.load_image(line)
                break
            end

        -- Check if content is IMAGE
        if(string.find(line, TYPE_IMAGE_2) ~= nil)
            then
                visibleObject = resource.load_image(line)
                break
            end

        -- Check if content is VIDEO
        if(string.find(line, TYPE_VIEO) ~= nil)
            then
                visibleObject = resource.load_video {
                    file        = line;
                    looped      = false;
                    audio       = true;
                    paused      = false;
                }
                break
            end

        break
    end
end

function readln()
    return coroutine.yield()
end

-- node.render is called for each frame so the moment a new image name comes in, it'll be replaced
function node.render()
    gl.clear(1, 1, 1, 1)
    -- util.draw_correct(visibleObject, 0, 0, NATIVE_WIDTH, NATIVE_HEIGHT)
    visibleObject:draw(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT)
end
