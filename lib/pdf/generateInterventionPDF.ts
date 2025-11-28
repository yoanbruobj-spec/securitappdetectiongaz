import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logoBlancBase64 } from '../utils/logoBlancBase64'
import { logoBase64 } from '../utils/logoBase64'

interface InterventionData {
  intervention: any
  centrales: any[]
  site: any
  client: any
  photos?: any[]
}

// ============================================
// FONCTION UTILITAIRE - Vérifier si une valeur est remplie
// ============================================
function hasValue(val: any): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed !== '' && trimmed !== 'N/A' && trimmed !== '-' && trimmed !== 'N/A '
  }
  return true
}

function formatValue(val: any, suffix?: string): string {
  if (!hasValue(val)) return ''
  const result = String(val).trim()
  return suffix ? `${result} ${suffix}`.trim() : result
}

// ============================================
// PALETTE DE COULEURS - STYLE OFFICIEL
// ============================================
const COLORS = {
  primary: [180, 28, 28] as [number, number, number],       // Rouge SÉCUR'IT foncé
  secondary: [30, 41, 59] as [number, number, number],      // Slate 800
  accent: [37, 99, 235] as [number, number, number],        // Bleu officiel
  success: [21, 128, 61] as [number, number, number],       // Vert foncé
  warning: [161, 98, 7] as [number, number, number],        // Jaune foncé
  danger: [185, 28, 28] as [number, number, number],        // Rouge foncé
  dark: [15, 23, 42] as [number, number, number],           // Presque noir
  gray: [71, 85, 105] as [number, number, number],          // Gris moyen
  lightGray: [241, 245, 249] as [number, number, number],   // Gris très clair
  white: [255, 255, 255] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],      // Bordure grise
}

export async function generateInterventionPDF(data: InterventionData) {
  const { intervention, centrales, site, client, photos = [] } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let yPos = margin

  // Formater la date
  const dateStr = intervention.date_intervention
    ? new Date(intervention.date_intervention).toLocaleDateString('fr-FR')
    : 'N/A'

  // Mapping des types d'intervention
  const typeMapping: Record<string, string> = {
    'maintenance_preventive': 'Maintenance Préventive',
    'maintenance_corrective': 'Maintenance Corrective',
    'verification_periodique': 'Vérification Périodique',
    'installation': 'Installation',
    'mise_en_service': 'Mise en Service',
    'reparation': 'Réparation',
    'depannage': 'Dépannage',
    'diagnostic': 'Diagnostic',
    'formation': 'Formation',
    'autre': 'Autre'
  }

  const typeIntervention = intervention.type
    ? (typeMapping[intervention.type] || intervention.type.replace(/_/g, ' '))
    : 'Intervention'

  // Structure pour le sommaire
  const sommaire: { titre: string; page: number }[] = []
  let currentPage = 1

  // ============================================
  // PAGE 1 - PAGE DE GARDE OFFICIELLE
  // ============================================

  // En-tête avec bandeau
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 50, 'F')

  // Logo
  try {
    doc.addImage(logoBlancBase64, 'PNG', (pageWidth - 80) / 2, 10, 80, 20)
  } catch {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text("SÉCUR'IT", pageWidth / 2, 28, { align: 'center' })
  }

  // Sous-titre entreprise
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Détection Gaz & Sécurité Industrielle', pageWidth / 2, 42, { align: 'center' })

  // Coordonnées
  yPos = 60
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text('6 rue Georges BRASSENS, Zac des 4 saisons, 31140 Fonbeauzard', pageWidth / 2, yPos, { align: 'center' })
  doc.text('Tél: 06 13 84 53 98  •  Email: christophe.agnus@yahoo.fr', pageWidth / 2, yPos + 5, { align: 'center' })

  // Ligne séparatrice
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos + 12, pageWidth - margin, yPos + 12)

  // Titre du document
  yPos = 95
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 25, 'F')
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(1)
  doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 25, 'S')

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT D\'INTERVENTION', pageWidth / 2, yPos + 5, { align: 'center' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.primary)
  doc.text(typeIntervention.toUpperCase(), pageWidth / 2, yPos + 13, { align: 'center' })

  // Tableau d'informations principales
  yPos = 135

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMATIONS GÉNÉRALES', margin, yPos)
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.8)
  doc.line(margin, yPos + 2, margin + 55, yPos + 2)

  yPos += 10

  const infoTableData: string[][] = []
  if (hasValue(client?.nom)) infoTableData.push(['Client', client.nom])
  if (hasValue(site?.nom)) infoTableData.push(['Site', site.nom])
  const adresseStr = `${site?.adresse || ''}, ${site?.ville || ''}`.trim().replace(/^,|,$/g, '').trim()
  if (hasValue(adresseStr)) infoTableData.push(['Adresse', adresseStr])
  if (hasValue(dateStr) && dateStr !== 'N/A') infoTableData.push(['Date d\'intervention', dateStr])
  const horairesStr = `${intervention.heure_debut || ''} - ${intervention.heure_fin || ''}`.trim()
  if (hasValue(horairesStr) && horairesStr !== '-') infoTableData.push(['Horaires', horairesStr])
  if (hasValue(intervention.technicien)) infoTableData.push(['Technicien', intervention.technicien])
  if (hasValue(intervention.local)) infoTableData.push(['Local / Zone', intervention.local])
  if (hasValue(intervention.contact_site)) infoTableData.push(['Contact sur site', intervention.contact_site])
  if (hasValue(intervention.tel_contact)) infoTableData.push(['Téléphone contact', intervention.tel_contact])

  autoTable(doc, {
    startY: yPos,
    body: infoTableData,
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: COLORS.border,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        fillColor: COLORS.lightGray,
        textColor: COLORS.secondary,
        cellWidth: 45
      },
      1: {
        textColor: COLORS.dark
      },
    },
    margin: { left: margin, right: margin },
    tableLineColor: COLORS.border,
    tableLineWidth: 0.3,
  })

  // Numéro de rapport et date de génération
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text(`Rapport N° ${intervention.id?.substring(0, 8).toUpperCase() || 'N/A'}`, margin, pageHeight - 25)
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, margin, pageHeight - 20)

  // ============================================
  // PAGE 2 - SOMMAIRE
  // ============================================

  doc.addPage()
  currentPage = 2

  drawOfficialHeader(doc, 'SOMMAIRE')
  yPos = 50

  // Le sommaire sera rempli à la fin
  const sommairePageRef = currentPage
  const sommaireYRef = yPos

  // Placeholder pour le sommaire
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  doc.text('(Sommaire généré automatiquement)', pageWidth / 2, yPos + 20, { align: 'center' })

  // ============================================
  // PAGE 3 - SYNTHÈSE / RÉCAPITULATIF
  // ============================================

  doc.addPage()
  currentPage = 3
  sommaire.push({ titre: '1. Synthèse de l\'intervention', page: currentPage })

  drawOfficialHeader(doc, 'SYNTHÈSE DE L\'INTERVENTION')
  yPos = 50

  // Résumé de l'intervention
  yPos = drawOfficialSection(doc, '1.1 Résumé', yPos)

  const resumeData = [
    ['Type d\'intervention', typeIntervention],
    ['Date', dateStr],
    ['Nombre d\'équipements contrôlés', `${centrales.length} centrale(s) / automate(s)`],
    ['Nombre total de détecteurs gaz', `${centrales.reduce((acc, c) => acc + (c.detecteurs_gaz?.length || 0), 0)}`],
    ['Nombre total de détecteurs flamme', `${centrales.reduce((acc, c) => acc + (c.detecteurs_flamme?.length || 0), 0)}`],
  ]

  autoTable(doc, {
    startY: yPos,
    body: resumeData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 4, lineColor: COLORS.border, lineWidth: 0.3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Tableau récapitulatif des statuts
  yPos = drawOfficialSection(doc, '1.2 État des équipements', yPos)

  const statutsData: any[][] = []

  centrales.forEach((centrale, idx) => {
    const marque = centrale.marque === 'Autre' && centrale.marque_personnalisee
      ? centrale.marque_personnalisee
      : centrale.marque
    const equipementLabel = centrale.type_equipement === 'automate' ? `Automate ${idx + 1}` : `Centrale ${idx + 1}`

    // Détecteurs gaz
    if (centrale.detecteurs_gaz) {
      centrale.detecteurs_gaz.forEach((det: any) => {
        statutsData.push([
          equipementLabel,
          'Gaz',
          `L${det.ligne} - ${det.marque} ${det.modele}`,
          det.type_gaz || det.gaz || 'N/A',
          det.statut_sensi || 'N/A',
        ])
      })
    }

    // Détecteurs flamme
    if (centrale.detecteurs_flamme) {
      centrale.detecteurs_flamme.forEach((det: any) => {
        let statut = 'NOK'
        if (det.asserv_operationnel === 'non_teste' || det.non_teste === true) {
          statut = 'Non testé'
        } else if (det.asserv_operationnel === true || det.asserv_operationnel === 'operationnel') {
          statut = 'OK'
        } else if (det.asserv_operationnel === 'partiel') {
          statut = 'Partiel'
        }
        statutsData.push([
          equipementLabel,
          'Flamme',
          `L${det.ligne} - ${det.marque} ${det.modele}`,
          '-',
          statut,
        ])
      })
    }
  })

  if (statutsData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Équipement', 'Type', 'Détecteur', 'Gaz', 'Statut']],
      body: statutsData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        4: {
          fontStyle: 'bold',
          halign: 'center',
        }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 4) {
          const val = data.cell.raw as string
          if (val === 'OK') {
            data.cell.styles.textColor = COLORS.success
          } else if (val === 'NOK' || val === 'À remplacer') {
            data.cell.styles.textColor = COLORS.danger
          } else if (val === 'Non testé') {
            data.cell.styles.textColor = COLORS.warning
          }
        }
      },
      margin: { left: margin, right: margin },
    })
    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // ============================================
  // PAGE 4+ - OBSERVATIONS GÉNÉRALES
  // ============================================

  if (intervention.observations_generales) {
    doc.addPage()
    currentPage++
    sommaire.push({ titre: '2. Observations générales', page: currentPage })

    drawOfficialHeader(doc, 'OBSERVATIONS GÉNÉRALES')
    yPos = 50

    yPos = drawOfficialSection(doc, '2.1 Observations du technicien', yPos)

    // Encadré pour les observations
    const obsLines = doc.splitTextToSize(intervention.observations_generales, pageWidth - 2 * margin - 10)
    const obsHeight = Math.max(40, obsLines.length * 5 + 15)

    doc.setFillColor(...COLORS.lightGray)
    doc.setDrawColor(...COLORS.border)
    doc.setLineWidth(0.5)
    doc.rect(margin, yPos, pageWidth - 2 * margin, obsHeight, 'FD')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text(obsLines, margin + 5, yPos + 8)
  }

  // ============================================
  // PAGES DÉTAILLÉES PAR CENTRALE
  // ============================================

  for (let i = 0; i < centrales.length; i++) {
    const centrale = centrales[i]
    const equipementType = centrale.type_equipement === 'automate' ? 'Automate' : 'Centrale'
    const marqueAffichee = centrale.marque === 'Autre' && centrale.marque_personnalisee
      ? centrale.marque_personnalisee
      : centrale.marque

    doc.addPage()
    currentPage++
    sommaire.push({ titre: `${sommaire.length + 1}. ${equipementType} ${i + 1} - ${marqueAffichee} ${centrale.modele}`, page: currentPage })

    drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - ${marqueAffichee} ${centrale.modele}`)
    yPos = 50

    // ============================================
    // INFORMATIONS DE L'ÉQUIPEMENT
    // ============================================

    yPos = drawOfficialSection(doc, `${sommaire.length}.1 Identification de l'équipement`, yPos)

    const equipData: string[][] = []
    equipData.push(["Type d'équipement", equipementType])
    if (hasValue(centrale.marque)) equipData.push(['Marque', marqueAffichee])
    if (hasValue(centrale.modele)) equipData.push(['Modèle', centrale.modele])
    if (hasValue(centrale.numero_serie)) equipData.push(['Numéro de série', centrale.numero_serie])
    if (hasValue(centrale.firmware)) equipData.push(['Version firmware', centrale.firmware])
    if (hasValue(centrale.etat_general)) equipData.push(['État général', centrale.etat_general])

    autoTable(doc, {
      startY: yPos,
      body: equipData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 4, lineColor: COLORS.border, lineWidth: 0.3 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 50 },
      },
      margin: { left: margin, right: margin },
    })
    yPos = (doc as any).lastAutoTable.finalY + 10

    // ============================================
    // AES
    // ============================================

    if (centrale.aes_presente && (centrale.aes_modele || centrale.aes_statut || centrale.aes_ondulee !== undefined)) {
      yPos = checkPageBreak(doc, yPos, 50, currentPage)
      if (yPos === 50) {
        currentPage++
        drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - SUITE`)
      }

      yPos = drawOfficialSection(doc, `${sommaire.length}.2 Alimentation Électrique de Sécurité (AES)`, yPos)

      const aesData: string[][] = []
      if (hasValue(centrale.aes_modele)) aesData.push(['Modèle AES', centrale.aes_modele])
      if (hasValue(centrale.aes_statut)) aesData.push(['Statut', centrale.aes_statut])
      if (centrale.aes_ondulee !== undefined && centrale.aes_ondulee !== null) aesData.push(['Type alimentation', centrale.aes_ondulee ? 'Ondulée' : 'Non ondulée'])

      autoTable(doc, {
        startY: yPos,
        body: aesData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 4, lineColor: COLORS.border, lineWidth: 0.3 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 50 },
        },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // ============================================
    // DÉTECTEURS GAZ - INFORMATIONS COMPLÈTES
    // ============================================

    if (centrale.detecteurs_gaz && centrale.detecteurs_gaz.length > 0) {
      yPos = checkPageBreak(doc, yPos, 60, currentPage)
      if (yPos === 50) {
        currentPage++
        drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - DÉTECTEURS GAZ`)
      }

      yPos = drawOfficialSection(doc, `${sommaire.length}.3 Détecteurs de Gaz (${centrale.detecteurs_gaz.length} unité(s))`, yPos)

      for (let j = 0; j < centrale.detecteurs_gaz.length; j++) {
        const detecteur = centrale.detecteurs_gaz[j]

        yPos = checkPageBreak(doc, yPos, 120, currentPage)
        if (yPos === 50) {
          currentPage++
          drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - DÉTECTEURS GAZ (SUITE)`)
        }

        // Titre du détecteur
        doc.setFillColor(...COLORS.secondary)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
        doc.setTextColor(...COLORS.white)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`DÉTECTEUR GAZ N°${j + 1} - LIGNE ${detecteur.ligne}`, margin + 3, yPos + 5.5)
        yPos += 12

        // Tableau identification - seulement les champs remplis
        const detGazData: string[][] = []
        if (hasValue(detecteur.marque)) detGazData.push(['Marque', detecteur.marque])
        if (hasValue(detecteur.modele)) detGazData.push(['Modèle', detecteur.modele])
        if (hasValue(detecteur.numero_serie)) detGazData.push(['Numéro de série', detecteur.numero_serie])
        const typeGazVal = detecteur.type_gaz || detecteur.gaz
        if (hasValue(typeGazVal)) detGazData.push(['Type de gaz détecté', typeGazVal])
        if (hasValue(detecteur.gamme_mesure)) detGazData.push(['Gamme de mesure', detecteur.gamme_mesure])
        if (hasValue(detecteur.temps_reponse)) detGazData.push(['Temps de réponse (T90)', detecteur.temps_reponse])

        let detGazTableFinalY = yPos
        let datesTableFinalY = yPos

        if (detGazData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            body: detGazData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.border, lineWidth: 0.2 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 45 },
            },
            margin: { left: margin, right: pageWidth / 2 + 5 },
          })
          detGazTableFinalY = (doc as any).lastAutoTable.finalY
        }

        // Dates de remplacement (colonne droite) - seulement si remplies
        const datesData: string[][] = []
        if (hasValue(detecteur.date_remplacement)) {
          datesData.push(['Date remplacement cellule', new Date(detecteur.date_remplacement).toLocaleDateString('fr-FR')])
        }
        if (hasValue(detecteur.date_prochain_remplacement)) {
          datesData.push(['Prochain remplacement', new Date(detecteur.date_prochain_remplacement).toLocaleDateString('fr-FR')])
        }

        if (datesData.length > 0) {
          autoTable(doc, {
            startY: yPos,
            body: datesData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.border, lineWidth: 0.2 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 45 },
            },
            margin: { left: pageWidth / 2 + 5, right: margin },
          })
          datesTableFinalY = (doc as any).lastAutoTable.finalY
        }

        // Prendre le maximum des deux tableaux pour éviter le chevauchement
        yPos = Math.max(detGazTableFinalY, datesTableFinalY) + 8

        // Données étalonnage zéro - seulement si remplies
        const etalZeroData: string[][] = []
        if (hasValue(detecteur.gaz_zero)) etalZeroData.push(['Gaz zéro utilisé', detecteur.gaz_zero])
        if (hasValue(detecteur.statut_zero)) etalZeroData.push(['Statut', detecteur.statut_zero])

        // Données étalonnage sensibilité - seulement si remplies
        const etalSensiData: string[][] = []
        if (hasValue(detecteur.gaz_etalon)) etalSensiData.push(['Gaz étalon', detecteur.gaz_etalon])
        if (hasValue(detecteur.valeur_avant_reglage)) {
          etalSensiData.push(['Valeur avant réglage', `${detecteur.valeur_avant_reglage} ${detecteur.unite_etal || ''}`.trim()])
        }
        if (hasValue(detecteur.valeur_apres_reglage)) {
          etalSensiData.push(['Valeur après réglage', `${detecteur.valeur_apres_reglage} ${detecteur.unite_etal || ''}`.trim()])
        }
        if (hasValue(detecteur.coefficient)) etalSensiData.push(['Coefficient', detecteur.coefficient])
        if (hasValue(detecteur.statut_sensi)) etalSensiData.push(['Statut', detecteur.statut_sensi])

        // Afficher les sections étalonnage seulement si données présentes
        const hasEtalZero = etalZeroData.length > 0
        const hasEtalSensi = etalSensiData.length > 0

        if (hasEtalZero || hasEtalSensi) {
          // En-têtes étalonnage
          if (hasEtalZero) {
            doc.setFillColor(...COLORS.accent)
            doc.rect(margin, yPos, hasEtalSensi ? (pageWidth - 2 * margin) / 2 - 3 : pageWidth - 2 * margin, 6, 'F')
            doc.setTextColor(...COLORS.white)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.text('ÉTALONNAGE ZÉRO', margin + 3, yPos + 4)
          }

          if (hasEtalSensi) {
            doc.setFillColor(...COLORS.accent)
            doc.rect(hasEtalZero ? pageWidth / 2 + 2 : margin, yPos, hasEtalZero ? (pageWidth - 2 * margin) / 2 - 3 : pageWidth - 2 * margin, 6, 'F')
            doc.setTextColor(...COLORS.white)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'bold')
            doc.text('ÉTALONNAGE SENSIBILITÉ', hasEtalZero ? pageWidth / 2 + 5 : margin + 3, yPos + 4)
          }
          yPos += 8

          let zeroTableFinalY = yPos
          let sensiTableFinalY = yPos

          if (hasEtalZero) {
            autoTable(doc, {
              startY: yPos,
              body: etalZeroData,
              theme: 'plain',
              styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.border, lineWidth: 0.2 },
              columnStyles: {
                0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 35 },
              },
              margin: { left: margin, right: hasEtalSensi ? pageWidth / 2 + 5 : margin },
            })
            zeroTableFinalY = (doc as any).lastAutoTable.finalY
          }

          if (hasEtalSensi) {
            const statutIndex = etalSensiData.findIndex(row => row[0] === 'Statut')
            autoTable(doc, {
              startY: yPos,
              body: etalSensiData,
              theme: 'plain',
              styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.border, lineWidth: 0.2 },
              columnStyles: {
                0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 40 },
              },
              margin: { left: hasEtalZero ? pageWidth / 2 + 5 : margin, right: margin },
              didParseCell: function(data) {
                if (data.section === 'body' && statutIndex >= 0 && data.row.index === statutIndex && data.column.index === 1) {
                  const val = String(data.cell.raw)
                  if (val === 'OK') {
                    data.cell.styles.textColor = COLORS.success
                    data.cell.styles.fontStyle = 'bold'
                  } else if (val === 'NOK' || val === 'À remplacer') {
                    data.cell.styles.textColor = COLORS.danger
                    data.cell.styles.fontStyle = 'bold'
                  }
                }
              },
            })
            sensiTableFinalY = (doc as any).lastAutoTable.finalY
          }

          // Prendre le maximum des deux tableaux pour éviter le chevauchement
          yPos = Math.max(zeroTableFinalY, sensiTableFinalY) + 8
        }

        // Seuils d'alarme
        if (detecteur.seuils && detecteur.seuils.length > 0) {
          // Trier les seuils par niveau (1, 2, 3)
          const seuilsTries = [...detecteur.seuils].sort((a: any, b: any) => {
            const niveauA = a.niveau || 0
            const niveauB = b.niveau || 0
            return niveauA - niveauB
          })

          // Calculer l'espace nécessaire pour le tableau complet (header + lignes)
          const seuilsTableHeight = 8 + 10 + (seuilsTries.length * 12) // header bandeau + en-tête tableau + lignes

          // Vérifier s'il y a assez de place, sinon saut de page
          yPos = checkPageBreak(doc, yPos, seuilsTableHeight, currentPage)
          if (yPos === 50) {
            currentPage++
            drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - SEUILS D'ALARME`)
          }

          doc.setFillColor(...COLORS.warning)
          doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F')
          doc.setTextColor(...COLORS.white)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('SEUILS D\'ALARME', margin + 3, yPos + 4)
          yPos += 8

          const seuilsTableData = seuilsTries.map((seuil: any) => {
            let asservStatus = 'Non opérationnel'
            if (seuil.asserv_operationnel === 'non_teste' || seuil.non_teste === true) {
              asservStatus = 'Non testé'
            } else if (seuil.asserv_operationnel === true || seuil.asserv_operationnel === 'operationnel') {
              asservStatus = 'Opérationnel'
            } else if (seuil.asserv_operationnel === 'partiel') {
              asservStatus = 'Partiellement opérationnel'
            }

            return [
              seuil.niveau ? `Seuil ${seuil.niveau}` : (seuil.nom || 'N/A'),
              `${seuil.valeur || 'N/A'} ${seuil.unite || ''}`,
              seuil.asservissements || 'N/A',
              asservStatus,
            ]
          })

          autoTable(doc, {
            startY: yPos,
            head: [['Niveau', 'Valeur', 'Asservissements', 'Asserv. opérationnel']],
            body: seuilsTableData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: {
              fillColor: COLORS.secondary,
              textColor: COLORS.white,
              fontStyle: 'bold',
              fontSize: 7,
            },
            columnStyles: {
              3: { halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
              if (data.section === 'body' && data.column.index === 3) {
                const val = data.cell.raw as string
                if (val === 'Opérationnel') {
                  data.cell.styles.textColor = COLORS.success
                } else if (val === 'Non opérationnel') {
                  data.cell.styles.textColor = COLORS.danger
                } else if (val === 'Partiellement opérationnel') {
                  data.cell.styles.textColor = COLORS.warning
                } else {
                  data.cell.styles.textColor = COLORS.secondary
                }
              }
            },
            margin: { left: margin, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 12
        } else {
          yPos += 5
        }
      }
    }

    // ============================================
    // DÉTECTEURS FLAMME
    // ============================================

    if (centrale.detecteurs_flamme && centrale.detecteurs_flamme.length > 0) {
      yPos = checkPageBreak(doc, yPos, 60, currentPage)
      if (yPos === 50) {
        currentPage++
        drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - DÉTECTEURS FLAMME`)
      }

      yPos = drawOfficialSection(doc, `${sommaire.length}.4 Détecteurs de Flamme (${centrale.detecteurs_flamme.length} unité(s))`, yPos)

      for (let j = 0; j < centrale.detecteurs_flamme.length; j++) {
        const detecteur = centrale.detecteurs_flamme[j]

        yPos = checkPageBreak(doc, yPos, 60, currentPage)
        if (yPos === 50) {
          currentPage++
          drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - DÉTECTEURS FLAMME (SUITE)`)
        }

        // Titre du détecteur
        doc.setFillColor(...COLORS.danger)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F')
        doc.setTextColor(...COLORS.white)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`DÉTECTEUR FLAMME N°${j + 1} - LIGNE ${detecteur.ligne}`, margin + 3, yPos + 5.5)
        yPos += 12

        // Tableau identification - seulement les champs remplis
        let asservStatus = ''
        if (detecteur.non_teste) asservStatus = 'Non testé'
        else if (detecteur.asserv_operationnel === true) asservStatus = 'Oui'
        else if (detecteur.asserv_operationnel === false) asservStatus = 'Non'

        const detFlammeData: string[][] = []
        if (hasValue(detecteur.marque)) detFlammeData.push(['Marque', detecteur.marque])
        if (hasValue(detecteur.modele)) detFlammeData.push(['Modèle', detecteur.modele])
        if (hasValue(detecteur.numero_serie)) detFlammeData.push(['Numéro de série', detecteur.numero_serie])
        if (hasValue(detecteur.type_connexion)) detFlammeData.push(['Type de connexion', detecteur.type_connexion])
        if (hasValue(detecteur.asservissements)) detFlammeData.push(['Asservissements', detecteur.asservissements])
        if (hasValue(asservStatus)) detFlammeData.push(['Asservissement opérationnel', asservStatus])

        if (detFlammeData.length > 0) {
          const asservIndex = detFlammeData.findIndex(row => row[0] === 'Asservissement opérationnel')
          autoTable(doc, {
            startY: yPos,
            body: detFlammeData,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 3, lineColor: COLORS.border, lineWidth: 0.2 },
            columnStyles: {
              0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 50 },
            },
            didParseCell: function(data) {
              if (data.section === 'body' && asservIndex >= 0 && data.row.index === asservIndex && data.column.index === 1) {
                const val = data.cell.raw as string
                if (val === 'Oui') {
                  data.cell.styles.textColor = COLORS.success
                  data.cell.styles.fontStyle = 'bold'
                } else if (val === 'Non') {
                  data.cell.styles.textColor = COLORS.danger
                  data.cell.styles.fontStyle = 'bold'
                } else if (val === 'Non testé') {
                  data.cell.styles.textColor = COLORS.warning
                  data.cell.styles.fontStyle = 'bold'
                }
              }
            },
            margin: { left: margin, right: margin },
          })
          yPos = (doc as any).lastAutoTable.finalY + 12
        }
      }
    }

    // ============================================
    // OBSERVATIONS / TRAVAUX / ANOMALIES
    // ============================================

    const hasObs = centrale.travaux_effectues || centrale.anomalies || centrale.recommandations || centrale.pieces_remplacees

    if (hasObs) {
      yPos = checkPageBreak(doc, yPos, 80, currentPage)
      if (yPos === 50) {
        currentPage++
        drawOfficialHeader(doc, `${equipementType.toUpperCase()} ${i + 1} - OBSERVATIONS`)
      }

      yPos = drawOfficialSection(doc, `${sommaire.length}.5 Observations et travaux`, yPos)

      if (centrale.travaux_effectues) {
        yPos = drawObsBlock(doc, 'TRAVAUX EFFECTUÉS', centrale.travaux_effectues, yPos, COLORS.success)
      }

      if (centrale.anomalies) {
        yPos = checkPageBreak(doc, yPos, 30, currentPage)
        yPos = drawObsBlock(doc, 'ANOMALIES CONSTATÉES', centrale.anomalies, yPos, COLORS.danger)
      }

      if (centrale.recommandations) {
        yPos = checkPageBreak(doc, yPos, 30, currentPage)
        yPos = drawObsBlock(doc, 'RECOMMANDATIONS', centrale.recommandations, yPos, COLORS.accent)
      }

      if (centrale.pieces_remplacees) {
        yPos = checkPageBreak(doc, yPos, 30, currentPage)
        yPos = drawObsBlock(doc, 'PIÈCES REMPLACÉES', centrale.pieces_remplacees, yPos, COLORS.warning)
      }
    }
  }

  // ============================================
  // PAGE PHOTOS
  // ============================================

  if (photos && photos.length > 0) {
    doc.addPage()
    currentPage++
    sommaire.push({ titre: `${sommaire.length + 1}. Documentation photographique`, page: currentPage })

    drawOfficialHeader(doc, 'DOCUMENTATION PHOTOGRAPHIQUE')
    yPos = 55

    const photosPerRow = 2
    const photoWidth = (pageWidth - 2 * margin - 10) / photosPerRow
    const photoHeight = photoWidth * 0.75
    let currentX = margin
    let photosInRow = 0

    for (const photo of photos) {
      if (photo.url) {
        try {
          yPos = checkPageBreak(doc, yPos, photoHeight + 20, currentPage)
          if (yPos === 50) {
            currentPage++
            drawOfficialHeader(doc, 'DOCUMENTATION PHOTOGRAPHIQUE (SUITE)')
            yPos = 55
          }

          doc.setDrawColor(...COLORS.border)
          doc.setLineWidth(0.5)
          doc.rect(currentX, yPos, photoWidth, photoHeight, 'S')

          doc.addImage(photo.url, 'JPEG', currentX + 1, yPos + 1, photoWidth - 2, photoHeight - 2)

          if (photo.legende) {
            doc.setFontSize(7)
            doc.setTextColor(...COLORS.gray)
            doc.setFont('helvetica', 'italic')
            const legendLines = doc.splitTextToSize(photo.legende, photoWidth - 4)
            doc.text(legendLines, currentX + 2, yPos + photoHeight + 4)
          }

          photosInRow++
          currentX += photoWidth + 10

          if (photosInRow >= photosPerRow) {
            photosInRow = 0
            currentX = margin
            yPos += photoHeight + 18
          }
        } catch (error) {
          console.error('Erreur ajout photo:', error)
        }
      }
    }
  }

  // ============================================
  // REMPLIR LE SOMMAIRE (PAGE 2)
  // ============================================

  doc.setPage(sommairePageRef)
  yPos = sommaireYRef

  doc.setFillColor(...COLORS.lightGray)
  doc.rect(margin, yPos, pageWidth - 2 * margin, sommaire.length * 10 + 15, 'F')

  yPos += 8

  sommaire.forEach((item, idx) => {
    doc.setTextColor(...COLORS.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(item.titre, margin + 5, yPos)

    // Points de conduite
    const titleWidth = doc.getTextWidth(item.titre)
    const pageNumWidth = doc.getTextWidth(String(item.page))
    const dotsStart = margin + 5 + titleWidth + 2
    const dotsEnd = pageWidth - margin - pageNumWidth - 10

    doc.setTextColor(...COLORS.gray)
    let dotX = dotsStart
    while (dotX < dotsEnd) {
      doc.text('.', dotX, yPos)
      dotX += 2
    }

    // Numéro de page
    doc.setTextColor(...COLORS.primary)
    doc.setFont('helvetica', 'bold')
    doc.text(String(item.page), pageWidth - margin - 5, yPos, { align: 'right' })

    yPos += 10
  })

  // ============================================
  // NUMÉROTATION FINALE DES PAGES
  // ============================================

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawOfficialFooter(doc, i, totalPages)
  }

  // ============================================
  // SAUVEGARDE
  // ============================================

  const sanitizeFileName = (str: string) => {
    return str
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim()
  }

  const clientName = sanitizeFileName(client?.nom || 'Client')
  const siteName = sanitizeFileName(site?.nom || 'Site')
  const localName = sanitizeFileName(intervention.local || 'Local')
  const dateFormatted = dateStr.replace(/\//g, '-')

  const fileName = `${dateFormatted}_${clientName}_${siteName}_${localName}.pdf`
  doc.save(fileName)
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function drawOfficialHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  // Bandeau supérieur
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 12, 'F')

  // Logo petit à gauche
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text("SÉCUR'IT", margin, 8)

  // Date à droite
  doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin, 8, { align: 'right' })

  // Titre de la section
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(0, 12, pageWidth, 25, 'F')

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 28, { align: 'center' })

  // Ligne sous le titre
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(1)
  doc.line(margin, 37, pageWidth - margin, 37)
}

function drawOfficialFooter(doc: jsPDF, pageNum: number, totalPages?: number) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15

  // Ligne de séparation
  doc.setDrawColor(...COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)

  // Coordonnées
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('SÉCUR\'IT - 6 rue Georges BRASSENS, 31140 Fonbeauzard - Tél: 06 13 84 53 98', margin, pageHeight - 12)

  // Numéro de page
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.primary)
  const pageText = totalPages ? `Page ${pageNum} / ${totalPages}` : `Page ${pageNum}`
  doc.text(pageText, pageWidth - margin, pageHeight - 12, { align: 'right' })
}

function drawOfficialSection(doc: jsPDF, title: string, yPos: number): number {
  const margin = 15

  doc.setTextColor(...COLORS.secondary)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin, yPos)

  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos + 2, margin + doc.getTextWidth(title), yPos + 2)

  return yPos + 10
}

function drawObsBlock(doc: jsPDF, title: string, content: string, yPos: number, color: [number, number, number]): number {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  const lines = doc.splitTextToSize(content, pageWidth - 2 * margin - 15)
  const blockHeight = Math.max(20, lines.length * 4.5 + 12)

  // Bordure gauche colorée
  doc.setFillColor(...color)
  doc.rect(margin, yPos, 4, blockHeight, 'F')

  // Fond
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(margin + 4, yPos, pageWidth - 2 * margin - 4, blockHeight, 'F')

  // Titre
  doc.setTextColor(...color)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin + 8, yPos + 6)

  // Contenu
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(lines, margin + 8, yPos + 12)

  return yPos + blockHeight + 6
}

function checkPageBreak(doc: jsPDF, yPos: number, spaceNeeded: number, currentPage: number): number {
  const pageHeight = doc.internal.pageSize.height
  if (yPos + spaceNeeded > pageHeight - 25) {
    doc.addPage()
    return 50 // Position après le header
  }
  return yPos
}
