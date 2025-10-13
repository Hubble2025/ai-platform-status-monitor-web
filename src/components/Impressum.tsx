import { ArrowLeft } from 'lucide-react';

interface ImpressumProps {
  onBack: () => void;
}

export function Impressum({ onBack }: ImpressumProps) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Impressum</h1>
        <p className="text-gray-400">Legal information and disclosure</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Angaben gemäß § 5 TMG</h2>
          <div className="text-gray-300 space-y-2">
            <p>Musterfirma GmbH</p>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
            <p>Deutschland</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Vertreten durch</h2>
          <div className="text-gray-300">
            <p>Geschäftsführer: Max Mustermann</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Kontakt</h2>
          <div className="text-gray-300 space-y-2">
            <p>Telefon: +49 (0) 123 456789</p>
            <p>E-Mail: info@example.com</p>
            <p>Website: www.example.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Registereintrag</h2>
          <div className="text-gray-300 space-y-2">
            <p>Eintragung im Handelsregister</p>
            <p>Registergericht: Amtsgericht Musterstadt</p>
            <p>Registernummer: HRB 12345</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Umsatzsteuer-ID</h2>
          <div className="text-gray-300">
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
            <p>DE123456789</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <div className="text-gray-300 space-y-2">
            <p>Max Mustermann</p>
            <p>Musterstraße 123</p>
            <p>12345 Musterstadt</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-3">Haftungsausschluss</h2>
          <div className="text-gray-300 space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">Haftung für Inhalte</h3>
              <p className="text-sm">
                Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
                zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Haftung für Links</h3>
              <p className="text-sm">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
                Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Urheberrecht</h3>
              <p className="text-sm">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
                Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
                Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              </p>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-500 italic">
            Dies ist ein Platzhalter-Impressum. Bitte ersetzen Sie diese Informationen durch Ihre tatsächlichen rechtlichen Angaben.
          </p>
        </div>
      </div>
    </div>
  );
}
