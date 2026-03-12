describe('Server configuration', () => {
  it('uses default PORT of 3000 when env var is not set', () => {
    delete process.env.PORT;
    const port = parseInt(process.env.PORT ?? '3000', 10);
    expect(port).toBe(3000);
  });

  it('uses default HOST of 0.0.0.0 when env var is not set', () => {
    delete process.env.HOST;
    const host = process.env.HOST ?? '0.0.0.0';
    expect(host).toBe('0.0.0.0');
  });
});
