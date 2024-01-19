# Phi 2

This is an attempt to rewrite using p2.js

It probably will never be finished, so I've just slapped the code here for the small amount of work I have done on it

## Better than matter.js
* Has planes/lines
* A lot more stable
* Built-in support for convex polygons (matter.js uses the same library as p2.js for this, but it's not as well ingrained)
* Shoots clipped objects out of each other (fun)

## Worse than matter.js
* Object orientated (I've overridden a lot of behavior to do some janky thing, and it means it cannot be easily serialized)
* Very inconsistent API (some OOP, some plain object-based, methods missing and all over the place)
* All bodies are composed of shapes which makes it unintuitive if I were to expose the API to the user (as I want to completely disregard shapes' existence and just have CSG for combining)
* No built-in renderer (I should make my own renderer for matter.js anyway)
* I've already built it in matter.js x-x