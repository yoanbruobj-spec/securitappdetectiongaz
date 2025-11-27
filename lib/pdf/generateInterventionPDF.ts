import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logoBlancBase64 } from '../utils/logoBlancBase64'

interface InterventionData {
  intervention: any
  centrales: any[]
  site: any
  client: any
  photos?: any[]
}

// ============================================
// PALETTE DE COULEURS MODERNE
// ============================================
const COLORS = {
  primary: [220, 38, 38] as [number, number, number],      // Rouge SÉCUR'IT
  primaryDark: [185, 28, 28] as [number, number, number],  // Rouge foncé
  secondary: [30, 41, 59] as [number, number, number],     // Slate 800
  accent: [59, 130, 246] as [number, number, number],      // Bleu
  success: [22, 163, 74] as [number, number, number],      // Vert
  warning: [234, 179, 8] as [number, number, number],      // Jaune
  danger: [239, 68, 68] as [number, number, number],       // Rouge clair
  dark: [15, 23, 42] as [number, number, number],          // Slate 900
  gray: [100, 116, 139] as [number, number, number],       // Slate 500
  lightGray: [241, 245, 249] as [number, number, number],  // Slate 100
  white: [255, 255, 255] as [number, number, number],
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

  // ============================================
  // PAGE DE GARDE MODERNE
  // ============================================

  // Fond dégradé en haut
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 85, 'F')

  // Forme décorative
  doc.setFillColor(...COLORS.primaryDark)
  doc.triangle(pageWidth - 60, 0, pageWidth, 0, pageWidth, 60, 'F')

  // Logo centré
  try {
    doc.addImage(logoBlancBase64, 'PNG', (pageWidth - 90) / 2, 20, 90, 22)
  } catch {
    doc.setTextColor(...COLORS.white)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text("SÉCUR'IT", pageWidth / 2, 35, { align: 'center' })
  }

  // Slogan
  doc.setTextColor(255, 255, 255, 0.9)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Détection Gaz & Sécurité', pageWidth / 2, 52, { align: 'center' })

  // Coordonnées entreprise - bandeau gris
  doc.setFillColor(...COLORS.lightGray)
  doc.rect(0, 85, pageWidth, 25, 'F')

  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.text('6 rue Georges BRASSENS, Zac des 4 saisons, 31140 Fonbeauzard', pageWidth / 2, 94, { align: 'center' })
  doc.text('Tél: 06 13 84 53 98  |  Email: christophe.agnus@yahoo.fr', pageWidth / 2, 102, { align: 'center' })

  // Titre principal
  yPos = 130
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT D\'INTERVENTION', pageWidth / 2, yPos, { align: 'center' })

  // Ligne décorative sous le titre
  doc.setDrawColor(...COLORS.primary)
  doc.setLineWidth(2)
  doc.line(pageWidth / 2 - 45, yPos + 5, pageWidth / 2 + 45, yPos + 5)

  // Badge type d'intervention
  yPos += 20
  const typeWidth = doc.getTextWidth(typeIntervention.toUpperCase()) + 20
  doc.setFillColor(...COLORS.secondary)
  doc.roundedRect((pageWidth - typeWidth) / 2, yPos - 6, typeWidth, 12, 6, 6, 'F')
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(typeIntervention.toUpperCase(), pageWidth / 2, yPos + 2, { align: 'center' })

  // Carte d'informations principales
  yPos += 25
  const cardHeight = 95

  // Ombre de la carte
  doc.setFillColor(200, 200, 200)
  doc.roundedRect(margin + 2, yPos + 2, pageWidth - 2 * margin, cardHeight, 8, 8, 'F')

  // Carte blanche
  doc.setFillColor(...COLORS.white)
  doc.setDrawColor(...COLORS.lightGray)
  doc.setLineWidth(1)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 8, 8, 'FD')

  // Contenu de la carte
  const cardX = margin + 15
  const cardX2 = pageWidth / 2 + 10
  let cardY = yPos + 18

  // Ligne 1: Client & Site
  drawInfoField(doc, 'CLIENT', client?.nom || 'N/A', cardX, cardY)
  drawInfoField(doc, 'SITE', site?.nom || 'N/A', cardX2, cardY)

  cardY += 25

  // Ligne 2: Adresse complète
  const adresse = `${site?.adresse || ''}, ${site?.ville || ''}`.trim()
  drawInfoField(doc, 'ADRESSE', adresse !== ',' ? adresse : 'N/A', cardX, cardY, pageWidth - 2 * margin - 30)

  cardY += 25

  // Ligne 3: Date & Technicien
  drawInfoField(doc, 'DATE', dateStr, cardX, cardY)
  drawInfoField(doc, 'TECHNICIEN', intervention.technicien || 'N/A', cardX2, cardY)

  // Numéro de rapport en bas de page
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(9)
  doc.text(`Rapport N° ${intervention.id?.substring(0, 8).toUpperCase() || 'N/A'}`, pageWidth / 2, pageHeight - 30, { align: 'center' })

  doc.setFontSize(8)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 22, { align: 'center' })

  // ============================================
  // PAGE 2 - DÉTAILS DE L'INTERVENTION
  // ============================================

  doc.addPage()
  yPos = margin

  // En-tête de page
  drawPageHeader(doc, 'DÉTAILS DE L\'INTERVENTION')
  yPos = 45

  // Section informations générales
  yPos = drawSectionHeader(doc, 'Informations Générales', yPos, COLORS.accent)
  yPos += 8

  const infoData: string[][] = []
  if (client?.nom) infoData.push(['Client', client.nom])
  if (site?.nom) infoData.push(['Site', site.nom])
  const adresseComplete = `${site?.adresse || ''}, ${site?.ville || ''}`.trim()
  if (adresseComplete && adresseComplete !== ',') infoData.push(['Adresse', adresseComplete])
  infoData.push(['Date d\'intervention', dateStr])
  const horaires = `${intervention.heure_debut || ''} - ${intervention.heure_fin || ''}`.trim()
  if (horaires && horaires !== '-') infoData.push(['Horaires', horaires])
  if (intervention.technicien) infoData.push(['Technicien', intervention.technicien])
  infoData.push(['Type d\'intervention', typeIntervention])
  if (intervention.local) infoData.push(['Local', intervention.local])
  if (intervention.contact_site) infoData.push(['Contact sur site', intervention.contact_site])
  if (intervention.tel_contact) infoData.push(['Téléphone contact', intervention.tel_contact])

  autoTable(doc, {
    startY: yPos,
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: { top: 6, bottom: 6, left: 10, right: 10 },
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        fillColor: COLORS.lightGray,
        textColor: COLORS.secondary,
        cellWidth: 55
      },
      1: {
        textColor: COLORS.dark
      },
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { left: margin, right: margin },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.5,
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Observations générales
  if (intervention.observations_generales) {
    yPos = checkPageBreak(doc, yPos, 50)
    yPos = drawSectionHeader(doc, 'Observations Générales', yPos, COLORS.secondary)
    yPos += 8

    // Carte pour les observations
    const obsLines = doc.splitTextToSize(intervention.observations_generales, pageWidth - 2 * margin - 20)
    const obsHeight = Math.max(35, obsLines.length * 5 + 15)

    doc.setFillColor(...COLORS.lightGray)
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, obsHeight, 5, 5, 'F')

    // Bordure gauche colorée
    doc.setFillColor(...COLORS.accent)
    doc.rect(margin, yPos, 4, obsHeight, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.dark)
    doc.text(obsLines, margin + 12, yPos + 10)
    yPos += obsHeight + 10
  }

  // ============================================
  // CENTRALES ET DÉTECTEURS
  // ============================================

  for (let i = 0; i < centrales.length; i++) {
    const centrale = centrales[i]

    doc.addPage()
    yPos = margin

    // En-tête
    const equipementType = centrale.type_equipement === 'automate' ? 'AUTOMATE' : 'CENTRALE'
    const marqueAffichee = centrale.marque === 'Autre' && centrale.marque_personnalisee
      ? centrale.marque_personnalisee
      : centrale.marque

    drawPageHeader(doc, `${equipementType} ${i + 1} - ${marqueAffichee} ${centrale.modele}`)
    yPos = 45

    // Informations de la centrale
    yPos = drawSectionHeader(doc, 'Informations Équipement', yPos, COLORS.accent)
    yPos += 8

    const centraleData: string[][] = []
    if (centrale.type_equipement) centraleData.push(["Type d'équipement", centrale.type_equipement === 'automate' ? 'Automate' : 'Centrale'])
    if (centrale.marque) centraleData.push(['Marque', marqueAffichee])
    if (centrale.modele) centraleData.push(['Modèle', centrale.modele])
    if (centrale.numero_serie) centraleData.push(['N° de série', centrale.numero_serie])
    if (centrale.firmware) centraleData.push(['Version firmware', centrale.firmware])
    if (centrale.etat_general) centraleData.push(['État général', centrale.etat_general])

    if (centraleData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        body: centraleData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: COLORS.lightGray, textColor: COLORS.secondary, cellWidth: 55 },
          1: { textColor: COLORS.dark }
        },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 12
    }

    // AES
    if (centrale.aes_presente && (centrale.aes_modele || centrale.aes_statut || centrale.aes_ondulee !== undefined)) {
      yPos = checkPageBreak(doc, yPos, 40)
      yPos = drawSectionHeader(doc, 'Alimentation Électrique de Sécurité (AES)', yPos, COLORS.success)
      yPos += 8

      const aesData: string[][] = []
      if (centrale.aes_modele) aesData.push(['Modèle AES', centrale.aes_modele])
      if (centrale.aes_statut) aesData.push(['Statut', centrale.aes_statut])
      if (centrale.aes_ondulee !== undefined) aesData.push(['Alimentation ondulée', centrale.aes_ondulee ? 'Oui' : 'Non'])

      autoTable(doc, {
        startY: yPos,
        body: aesData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: COLORS.lightGray, cellWidth: 55 },
        },
        margin: { left: margin, right: margin },
      })
      yPos = (doc as any).lastAutoTable.finalY + 12
    }

    // ============================================
    // DÉTECTEURS GAZ - Design carte moderne
    // ============================================

    if (centrale.detecteurs_gaz && centrale.detecteurs_gaz.length > 0) {
      yPos = checkPageBreak(doc, yPos, 40)
      yPos = drawSectionHeader(doc, `Détecteurs Gaz (${centrale.detecteurs_gaz.length})`, yPos, COLORS.warning)
      yPos += 10

      for (const detecteur of centrale.detecteurs_gaz) {
        yPos = checkPageBreak(doc, yPos, 90)

        // Carte du détecteur
        const cardStartY = yPos

        // En-tête de la carte
        doc.setFillColor(...COLORS.secondary)
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 14, 4, 4, 'F')
        // Masquer les coins arrondis du bas
        doc.setFillColor(...COLORS.secondary)
        doc.rect(margin, yPos + 7, pageWidth - 2 * margin, 7, 'F')

        doc.setTextColor(...COLORS.white)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`LIGNE ${detecteur.ligne}  •  ${detecteur.marque} ${detecteur.modele}`, margin + 8, yPos + 9)

        // Badge gaz type
        if (detecteur.type_gaz || detecteur.gaz) {
          const gazType = detecteur.type_gaz || detecteur.gaz
          const badgeWidth = doc.getTextWidth(gazType) + 12
          doc.setFillColor(...COLORS.warning)
          doc.roundedRect(pageWidth - margin - badgeWidth - 5, yPos + 3, badgeWidth, 8, 4, 4, 'F')
          doc.setTextColor(...COLORS.dark)
          doc.setFontSize(7)
          doc.text(gazType, pageWidth - margin - badgeWidth / 2 - 5, yPos + 8.5, { align: 'center' })
        }

        yPos += 14

        // Corps de la carte
        doc.setFillColor(...COLORS.lightGray)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 65, 'F')

        yPos += 8
        const col1 = margin + 8
        const col2 = pageWidth / 2

        doc.setTextColor(...COLORS.gray)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')

        // Infos principales
        doc.text('N° SÉRIE', col1, yPos)
        doc.text('GAMME DE MESURE', col2, yPos)

        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(detecteur.numero_serie || 'N/A', col1, yPos + 5)
        doc.text(detecteur.gamme_mesure || 'N/A', col2, yPos + 5)

        yPos += 15

        // Étalonnage
        doc.setTextColor(...COLORS.gray)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('ÉTALONNAGE ZÉRO', col1, yPos)
        doc.text('ÉTALONNAGE SENSIBILITÉ', col2, yPos)

        yPos += 5
        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')

        const etalZero = `${detecteur.gaz_zero || 'N/A'} - ${detecteur.statut_zero || ''}`
        doc.text(etalZero, col1, yPos)

        const etalSensi = detecteur.valeur_apres_reglage
          ? `Après: ${detecteur.valeur_apres_reglage} ${detecteur.unite_etal || ''}`
          : 'N/A'
        doc.text(etalSensi, col2, yPos)

        // Statut avec badge
        yPos += 12
        doc.setTextColor(...COLORS.gray)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('STATUT', col1, yPos)

        if (detecteur.statut_sensi) {
          const statusColor = detecteur.statut_sensi === 'OK' ? COLORS.success : COLORS.danger
          doc.setFillColor(...statusColor)
          doc.roundedRect(col1, yPos + 2, 25, 8, 4, 4, 'F')
          doc.setTextColor(...COLORS.white)
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.text(detecteur.statut_sensi, col1 + 12.5, yPos + 7, { align: 'center' })
        }

        // Dates de remplacement
        if (detecteur.date_remplacement || detecteur.date_prochain_remplacement) {
          doc.setTextColor(...COLORS.gray)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('REMPLACEMENT CELLULE', col2, yPos)

          yPos += 5
          doc.setTextColor(...COLORS.dark)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')

          if (detecteur.date_prochain_remplacement) {
            const dateProch = new Date(detecteur.date_prochain_remplacement).toLocaleDateString('fr-FR')
            doc.text(`Prochain: ${dateProch}`, col2, yPos)
          }
        }

        yPos = cardStartY + 85

        // Seuils d'alarme
        if (detecteur.seuils && detecteur.seuils.length > 0) {
          yPos = checkPageBreak(doc, yPos, 40)

          doc.setFillColor(...COLORS.white)
          doc.setDrawColor(...COLORS.lightGray)
          doc.roundedRect(margin + 5, yPos, pageWidth - 2 * margin - 10, 8 + detecteur.seuils.length * 8, 3, 3, 'FD')

          doc.setTextColor(...COLORS.secondary)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text('SEUILS D\'ALARME', margin + 10, yPos + 6)

          yPos += 10

          const seuilsData = detecteur.seuils.map((seuil: any) => {
            let asservStatus = 'Non'
            if (seuil.non_teste) asservStatus = 'Non testé'
            else if (seuil.asserv_operationnel) asservStatus = 'Oui'

            return [
              seuil.niveau ? `Seuil ${seuil.niveau}` : (seuil.nom || 'N/A'),
              `${seuil.valeur || 'N/A'} ${seuil.unite || ''}`,
              seuil.asservissements || 'N/A',
              asservStatus,
            ]
          })

          autoTable(doc, {
            startY: yPos,
            head: [['Seuil', 'Valeur', 'Asservissements', 'Opérationnel']],
            body: seuilsData,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: {
              fillColor: COLORS.secondary,
              textColor: COLORS.white,
              fontStyle: 'bold',
              fontSize: 7
            },
            margin: { left: margin + 8, right: margin + 8 },
          })
          yPos = (doc as any).lastAutoTable.finalY + 10
        }
      }
    }

    // ============================================
    // DÉTECTEURS FLAMME
    // ============================================

    if (centrale.detecteurs_flamme && centrale.detecteurs_flamme.length > 0) {
      yPos = checkPageBreak(doc, yPos, 40)
      yPos = drawSectionHeader(doc, `Détecteurs Flamme (${centrale.detecteurs_flamme.length})`, yPos, COLORS.danger)
      yPos += 10

      for (const detecteur of centrale.detecteurs_flamme) {
        yPos = checkPageBreak(doc, yPos, 50)

        // Carte du détecteur
        doc.setFillColor(...COLORS.danger)
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 4, 4, 'F')
        doc.rect(margin, yPos + 6, pageWidth - 2 * margin, 6, 'F')

        doc.setTextColor(...COLORS.white)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(`LIGNE ${detecteur.ligne}  •  ${detecteur.marque} ${detecteur.modele}`, margin + 8, yPos + 8)

        yPos += 12

        // Corps
        doc.setFillColor(...COLORS.lightGray)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 35, 'F')

        yPos += 8
        const col1 = margin + 8
        const col2 = pageWidth / 2

        doc.setTextColor(...COLORS.gray)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('N° SÉRIE', col1, yPos)
        doc.text('TYPE CONNEXION', col2, yPos)

        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(detecteur.numero_serie || 'N/A', col1, yPos + 5)
        doc.text(detecteur.type_connexion || 'N/A', col2, yPos + 5)

        yPos += 15

        doc.setTextColor(...COLORS.gray)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('ASSERVISSEMENTS', col1, yPos)
        doc.text('OPÉRATIONNEL', col2, yPos)

        doc.setTextColor(...COLORS.dark)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(detecteur.asservissements || 'N/A', col1, yPos + 5)

        // Badge statut
        let status = 'Non'
        let statusColor = COLORS.danger
        if (detecteur.non_teste) {
          status = 'Non testé'
          statusColor = COLORS.warning
        } else if (detecteur.asserv_operationnel) {
          status = 'Oui'
          statusColor = COLORS.success
        }

        doc.setFillColor(...statusColor)
        doc.roundedRect(col2, yPos + 1, 30, 8, 4, 4, 'F')
        doc.setTextColor(...COLORS.white)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text(status, col2 + 15, yPos + 6, { align: 'center' })

        yPos += 25
      }
    }

    // ============================================
    // OBSERVATIONS DE LA CENTRALE
    // ============================================

    const hasObservations = centrale.travaux_effectues || centrale.anomalies || centrale.recommandations || centrale.pieces_remplacees

    if (hasObservations) {
      yPos = checkPageBreak(doc, yPos, 60)
      yPos = drawSectionHeader(doc, 'Observations & Travaux', yPos, COLORS.secondary)
      yPos += 10

      if (centrale.travaux_effectues) {
        yPos = drawObservationCard(doc, 'Travaux effectués', centrale.travaux_effectues, yPos, COLORS.success)
      }

      if (centrale.anomalies) {
        yPos = checkPageBreak(doc, yPos, 30)
        yPos = drawObservationCard(doc, 'Anomalies constatées', centrale.anomalies, yPos, COLORS.danger)
      }

      if (centrale.recommandations) {
        yPos = checkPageBreak(doc, yPos, 30)
        yPos = drawObservationCard(doc, 'Recommandations', centrale.recommandations, yPos, COLORS.accent)
      }

      if (centrale.pieces_remplacees) {
        yPos = checkPageBreak(doc, yPos, 30)
        yPos = drawObservationCard(doc, 'Pièces remplacées', centrale.pieces_remplacees, yPos, COLORS.warning)
      }
    }
  }

  // ============================================
  // PAGE PHOTOS
  // ============================================

  if (photos && photos.length > 0) {
    doc.addPage()
    drawPageHeader(doc, 'DOCUMENTATION PHOTOGRAPHIQUE')
    yPos = 50

    const photosPerRow = 2
    const photoWidth = (pageWidth - 2 * margin - 15) / photosPerRow
    const photoHeight = photoWidth * 0.75
    let currentX = margin
    let photosInRow = 0

    for (const photo of photos) {
      if (photo.url) {
        try {
          yPos = checkPageBreak(doc, yPos, photoHeight + 25)

          // Cadre photo avec ombre
          doc.setFillColor(220, 220, 220)
          doc.roundedRect(currentX + 2, yPos + 2, photoWidth, photoHeight, 3, 3, 'F')

          doc.setFillColor(...COLORS.white)
          doc.setDrawColor(...COLORS.lightGray)
          doc.roundedRect(currentX, yPos, photoWidth, photoHeight, 3, 3, 'FD')

          doc.addImage(photo.url, 'JPEG', currentX + 2, yPos + 2, photoWidth - 4, photoHeight - 4)

          if (photo.legende) {
            doc.setFontSize(8)
            doc.setTextColor(...COLORS.gray)
            doc.setFont('helvetica', 'italic')
            const legendLines = doc.splitTextToSize(photo.legende, photoWidth - 4)
            doc.text(legendLines, currentX + 2, yPos + photoHeight + 6)
          }

          photosInRow++
          currentX += photoWidth + 15

          if (photosInRow >= photosPerRow) {
            photosInRow = 0
            currentX = margin
            yPos += photoHeight + 25
          }
        } catch (error) {
          console.error('Erreur ajout photo:', error)
        }
      }
    }
  }

  // ============================================
  // NUMÉROTATION DES PAGES
  // ============================================

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Ligne de séparation pied de page
    doc.setDrawColor(...COLORS.lightGray)
    doc.setLineWidth(0.5)
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Numéro de page
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.gray)
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' })

    // Nom entreprise
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text("SÉCUR'IT", margin, pageHeight - 8)
  }

  // ============================================
  // SAUVEGARDE DU FICHIER
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

function drawPageHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.width

  // Bandeau rouge
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, pageWidth, 35, 'F')

  // Titre
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 22, { align: 'center' })
}

function drawSectionHeader(doc: jsPDF, title: string, yPos: number, color: [number, number, number]): number {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  // Pastille colorée
  doc.setFillColor(...color)
  doc.circle(margin + 4, yPos + 2, 4, 'F')

  // Titre
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin + 12, yPos + 5)

  // Ligne
  doc.setDrawColor(...color)
  doc.setLineWidth(0.8)
  const textWidth = doc.getTextWidth(title)
  doc.line(margin + 14 + textWidth, yPos + 3, pageWidth - margin, yPos + 3)

  return yPos + 12
}

function drawInfoField(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth?: number) {
  doc.setTextColor(...COLORS.gray)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(label, x, y - 3)

  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  if (maxWidth) {
    const lines = doc.splitTextToSize(value, maxWidth)
    doc.text(lines[0] || value, x, y + 4)
  } else {
    doc.text(value, x, y + 4)
  }
}

function drawObservationCard(doc: jsPDF, title: string, content: string, yPos: number, color: [number, number, number]): number {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15

  const lines = doc.splitTextToSize(content, pageWidth - 2 * margin - 25)
  const cardHeight = Math.max(25, lines.length * 5 + 15)

  // Fond
  doc.setFillColor(...COLORS.lightGray)
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, cardHeight, 4, 4, 'F')

  // Bordure gauche colorée
  doc.setFillColor(...color)
  doc.roundedRect(margin, yPos, 5, cardHeight, 2, 2, 'F')
  doc.rect(margin + 2, yPos, 3, cardHeight, 'F')

  // Titre
  doc.setTextColor(...color)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), margin + 12, yPos + 8)

  // Contenu
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(lines, margin + 12, yPos + 15)

  return yPos + cardHeight + 8
}

function checkPageBreak(doc: jsPDF, yPos: number, spaceNeeded: number): number {
  const pageHeight = doc.internal.pageSize.height
  if (yPos + spaceNeeded > pageHeight - 25) {
    doc.addPage()
    return 20
  }
  return yPos
}
