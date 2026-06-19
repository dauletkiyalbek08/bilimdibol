import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — bilimdibol",
  description: "Политика конфиденциальности платформы bilimdibol.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Logo size={32} />
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-6 py-10 text-ink">
        <h1 className="text-2xl font-bold">Политика конфиденциальности</h1>
        <p className="text-sm text-muted">Обновлено: 2026</p>

        <p>
          Платформа <b>bilimdibol</b> (далее — «Платформа») — внутренняя CRM-система образовательной
          компании для управления заявками (лидами), клиентами, продажами и сотрудниками. Настоящая
          политика описывает, какие данные мы обрабатываем и как их защищаем.
        </p>

        <h2 className="text-lg font-semibold">Какие данные мы собираем</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Контактные данные потенциальных клиентов из форм и рекламных лид-форм: имя, телефон, email.</li>
          <li>Источник заявки и рекламные метки (UTM, кампания, креатив).</li>
          <li>Служебные данные сотрудников для работы в CRM.</li>
        </ul>

        <h2 className="text-lg font-semibold">Как используются данные</h2>
        <p>
          Данные используются исключительно для обработки заявок, связи с клиентами по поводу
          образовательных услуг и внутренней аналитики. Мы не продаём и не передаём персональные
          данные третьим лицам в маркетинговых целях.
        </p>

        <h2 className="text-lg font-semibold">Интеграции</h2>
        <p>
          Платформа может получать заявки из Meta (Facebook/Instagram) Lead Ads и других каналов
          через официальные API. Данные хранятся в защищённой базе данных и доступны только
          уполномоченным сотрудникам.
        </p>

        <h2 className="text-lg font-semibold">Хранение и удаление</h2>
        <p>
          Данные хранятся столько, сколько необходимо для работы с клиентом. По запросу мы удаляем
          персональные данные. Запрос на удаление: напишите нам по контактам ниже.
        </p>

        <h2 className="text-lg font-semibold">Контакты</h2>
        <p>По вопросам обработки данных: bilimdibol · email: privacy@bilimdibol.kz</p>

        <p className="pt-4 text-sm text-muted">© 2026 bilimdibol</p>
      </main>
    </div>
  );
}
