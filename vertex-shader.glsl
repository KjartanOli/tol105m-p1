attribute vec4 vPosition;
attribute vec2 vOffset;

void
main()
{
  vec4 t = vPosition;
  t.xy += vOffset;
  gl_Position = t;
}
