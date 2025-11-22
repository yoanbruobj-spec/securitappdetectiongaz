# Guide d'amélioration visuelle des PDFs

Ce guide détaille les améliorations à apporter aux fichiers PDF générés pour les rendre plus professionnels et structurés.

## Fichiers concernés

- `lib/pdf/generateInterventionPDF.ts` (rapport fixe)
- `lib/pdf/generateInterventionPortablePDF.ts` (rapport portable)

---

## Améliorations communes aux deux PDFs

### 1. En-tête professionnel avec logo

```typescript
// Ajouter en haut du PDF, après l'importation
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer'

// Dans le composant Document
<View style={styles.header}>
  {/* Logo (si disponible) */}
  {/* <Image src="/logo.png" style={styles.logo} /> */}

  <View style={styles.headerContent}>
    <Text style={styles.companyName}>VOTRE ENTREPRISE</Text>
    <Text style={styles.companyTagline}>Expert en détection de gaz</Text>
  </View>

  <View style={styles.headerRight}>
    <Text style={styles.reportType}>RAPPORT D'INTERVENTION</Text>
    <Text style={styles.reportNumber}>N° {rapportNumber}</Text>
  </View>
</View>

// Styles
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 30,
  paddingBottom: 20,
  borderBottomWidth: 3,
  borderBottomColor: '#10b981',
  borderBottomStyle: 'solid'
},
logo: {
  width: 80,
  height: 80
},
headerContent: {
  flex: 1,
  paddingLeft: 20
},
companyName: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#10b981',
  marginBottom: 4
},
companyTagline: {
  fontSize: 10,
  color: '#6b7280'
},
headerRight: {
  alignItems: 'flex-end'
},
reportType: {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#374151',
  marginBottom: 4
},
reportNumber: {
  fontSize: 10,
  color: '#6b7280'
}
```

### 2. Footer avec numéro de page

```typescript
// Utiliser le composant Page avec props
<Page size="A4" style={styles.page}>
  {/* Contenu principal */}
  <View style={styles.content}>
    {/* ... */}
  </View>

  {/* Footer */}
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>
      Document confidentiel - Ne pas diffuser
    </Text>
    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
      `Page ${pageNumber} / ${totalPages}`
    } />
    <Text style={styles.footerDate}>
      Généré le {new Date().toLocaleDateString('fr-FR')}
    </Text>
  </View>
</Page>

// Styles
footer: {
  position: 'absolute',
  bottom: 30,
  left: 40,
  right: 40,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 10,
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb',
  borderTopStyle: 'solid'
},
footerText: {
  fontSize: 8,
  color: '#9ca3af',
  flex: 1
},
pageNumber: {
  fontSize: 8,
  color: '#6b7280',
  textAlign: 'center',
  flex: 1
},
footerDate: {
  fontSize: 8,
  color: '#9ca3af',
  textAlign: 'right',
  flex: 1
}
```

### 3. Sections mieux délimitées

```typescript
// Composant Section réutilisable
const Section = ({ title, icon, children }: { title: string, icon?: string, children: React.ReactNode }) => (
  <View style={styles.section} break>
    <View style={styles.sectionHeader}>
      {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
)

// Styles
section: {
  marginBottom: 25,
  backgroundColor: '#f9fafb',
  borderRadius: 8,
  padding: 15,
  borderLeftWidth: 4,
  borderLeftColor: '#10b981',
  borderLeftStyle: 'solid'
},
sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  borderBottomStyle: 'solid'
},
sectionIcon: {
  fontSize: 16,
  marginRight: 8
},
sectionTitle: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#1f2937',
  textTransform: 'uppercase',
  letterSpacing: 0.5
},
sectionContent: {
  paddingTop: 8
}
```

### 4. Tableaux plus lisibles

```typescript
// Tableau avec alternance de couleurs
const TableRow = ({ data, isHeader, isEven }: { data: string[], isHeader?: boolean, isEven?: boolean }) => (
  <View style={[
    styles.tableRow,
    isHeader && styles.tableHeaderRow,
    !isHeader && isEven && styles.tableEvenRow
  ]}>
    {data.map((cell, index) => (
      <Text
        key={index}
        style={[
          styles.tableCell,
          isHeader && styles.tableCellHeader
        ]}
      >
        {cell}
      </Text>
    ))}
  </View>
)

// Styles
tableRow: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  borderBottomStyle: 'solid',
  minHeight: 30,
  alignItems: 'center'
},
tableHeaderRow: {
  backgroundColor: '#10b981',
  borderBottomWidth: 2,
  borderBottomColor: '#059669'
},
tableEvenRow: {
  backgroundColor: '#f3f4f6'
},
tableCell: {
  flex: 1,
  padding: 8,
  fontSize: 9,
  color: '#374151'
},
tableCellHeader: {
  fontWeight: 'bold',
  color: '#ffffff',
  fontSize: 10,
  textTransform: 'uppercase'
}
```

### 5. Badges de statut colorés

```typescript
const StatusBadge = ({ status, label }: { status: 'success' | 'warning' | 'danger' | 'info', label: string }) => {
  const colors = {
    success: { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
    danger: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    info: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' }
  }

  const color = colors[status]

  return (
    <View style={{
      backgroundColor: color.bg,
      borderWidth: 1,
      borderColor: color.border,
      borderStyle: 'solid',
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 10,
      alignSelf: 'flex-start'
    }}>
      <Text style={{
        fontSize: 8,
        fontWeight: 'bold',
        color: color.text
      }}>
        {label}
      </Text>
    </View>
  )
}

// Utilisation
<StatusBadge status="success" label="BON" />
<StatusBadge status="danger" label="DÉFAILLANT" />
<StatusBadge status="warning" label="À SURVEILLER" />
```

### 6. Icônes avec émojis ou symboles

```typescript
// Utiliser des émojis pour les icônes
const icons = {
  check: '✓',
  cross: '✗',
  warning: '⚠️',
  info: 'ℹ️',
  calendar: '📅',
  location: '📍',
  user: '👤',
  phone: '📞',
  email: '✉️',
  building: '🏢'
}

// Utilisation dans le texte
<Text style={styles.infoRow}>
  <Text style={styles.icon}>{icons.location}</Text>
  <Text style={styles.infoLabel}>Adresse : </Text>
  <Text style={styles.infoValue}>{site.adresse}</Text>
</Text>

// Styles
icon: {
  fontSize: 12,
  marginRight: 6
},
infoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8
},
infoLabel: {
  fontSize: 10,
  color: '#6b7280',
  fontWeight: 'bold',
  width: 100
},
infoValue: {
  fontSize: 10,
  color: '#374151',
  flex: 1
}
```

### 7. Couleurs selon criticité

```typescript
function getStatusColor(etat: string) {
  switch (etat.toLowerCase()) {
    case 'bon':
    case 'ok':
    case 'conforme':
      return '#10b981' // Vert
    case 'acceptable':
    case 'à surveiller':
      return '#f59e0b' // Orange
    case 'défaillant':
    case 'hs':
    case 'non conforme':
      return '#ef4444' // Rouge
    default:
      return '#6b7280' // Gris
  }
}

// Utilisation
<Text style={{ color: getStatusColor(detecteur.etat) }}>
  {detecteur.etat}
</Text>
```

### 8. Espacement et typographie cohérents

```typescript
// Styles de base améliorés
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.6
  },

  // Titres hiérarchiques
  h1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  h2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    marginTop: 20
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 8,
    marginTop: 12
  },

  // Textes
  body: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.6
  },
  small: {
    fontSize: 8,
    color: '#6b7280'
  },
  bold: {
    fontWeight: 'bold'
  },

  // Espacements
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mb4: { marginBottom: 16 },
  mb5: { marginBottom: 20 },

  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
  mt4: { marginTop: 16 },
  mt5: { marginTop: 20 }
})
```

---

## Exemple de structure complète améliorée

```typescript
export function generateImprovedPDF(data: any) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header} fixed>
          {/* ... header content ... */}
        </View>

        {/* Informations générales */}
        <Section title="Informations générales" icon="📋">
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <InfoRow icon="🏢" label="Client" value={data.client} />
              <InfoRow icon="📍" label="Site" value={data.site} />
            </View>
            <View style={styles.infoCol}>
              <InfoRow icon="📅" label="Date" value={data.date} />
              <InfoRow icon="👤" label="Technicien" value={data.technicien} />
            </View>
          </View>
        </Section>

        {/* Synthèse des équipements */}
        <Section title="Synthèse des équipements" icon="⚙️">
          <View style={styles.statsRow}>
            <StatCard label="Centrales" value="3" color="#10b981" />
            <StatCard label="Détecteurs" value="15" color="#3b82f6" />
            <StatCard label="Alertes" value="2" color="#ef4444" />
          </View>
        </Section>

        {/* Détail par centrale */}
        {data.centrales.map((centrale: any, index: number) => (
          <Section key={index} title={`Centrale ${centrale.numero}`} icon="🖥️">
            {/* Contenu de la centrale avec tableaux améliorés */}
          </Section>
        ))}

        {/* Conclusion */}
        <Section title="Conclusion" icon="📝">
          <Text style={styles.body}>{data.conclusion}</Text>
        </Section>

        {/* Footer */}
        <View style={styles.footer} fixed>
          {/* ... footer content ... */}
        </View>
      </Page>
    </Document>
  )
}
```

---

## Notes importantes

1. **Ne pas supprimer de fonctionnalités** : Toutes les données actuelles doivent être conservées
2. **Cohérence visuelle** : Utiliser les mêmes couleurs et styles dans tout le document
3. **Lisibilité** : Privilégier la clarté à la densité d'information
4. **Hiérarchie visuelle** : Utiliser les tailles, poids et couleurs pour guider l'œil
5. **Espacement** : Laisser respirer le document avec des marges et paddings appropriés

---

## Palette de couleurs recommandée

- **Principal (vert)** : #10b981 (succès, titres importants)
- **Secondaire (bleu)** : #3b82f6 (informations, badges)
- **Attention (orange)** : #f59e0b (avertissements)
- **Danger (rouge)** : #ef4444 (erreurs, défaillances)
- **Texte principal** : #1f2937
- **Texte secondaire** : #6b7280
- **Bordures** : #e5e7eb
- **Arrière-plans** : #f9fafb

Cette palette est cohérente avec votre design système actuel.
