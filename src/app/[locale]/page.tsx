export default function Home({params}: {params: {locale: string}}) {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl">Hello from locale: {params.locale}</h1>
        <p>This is a test page</p>
      </div>
    </div>
  )
}
