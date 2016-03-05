# carpetweaver
a html5 app for carpet weaving

###idea
image panels in the first row are:
* palette - drag image to fill it with colors, click to select one
* tassels - this 1px wide canvas creates tassels of the carpet, put several colors on it and they will be looped
* outer rim - the outer rim of the carpet, works just like tassels
* inner rim - and the inner same as well
* corner - corner canvas is always rectangular and defines border height, when weaving corner image is flipped and flopped
* border A - canvas with border, it should match corner along both right and bottom edges
* border B - optional border

###options
* update - set carpet weaving method, it can be
  * automatic - weaving may take 20-100ms
  * on change - only when change is applied
  * manual - only when render button is pressed (one with flash)
* border - sets how borders is looped
  * AA - border A canvas is duplicated
  * AB - border A and B are placed one after other
  * ABA - as above but A is always ending the strip
* duplicate rows - in case border is too short some rows/columns may be duplicated (not ready yet)
  * void - first option turns this off
  * border A first column
  * border A last column
  * border B first column
  * border B last column


###keys (image panels):
* x - swap colors
* f - flood fill
* shift - pan the image
* ctrl - pick a color

###keys (general)
* ctrl+s - save
* ctrl+z - undo
