export async function GET() {
  return Response.json({
    status: 'ok',
    service: 'AIAgentsAllTheThings SimLab',
    fictional: true,
  });
}
