var s = create2048Game({
});
s.start($('#c'));
$('#r').click(function()
{
	s.reset();
});
s.gameover(function()
{
	alert(s.score());
});
document;