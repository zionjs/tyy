import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  try {
    const query = req.query.q || req.query.query

    if (!query) {
      return res.status(400).json({
        status: false,
        message: 'parameter q / query wajib diisi'
      })
    }

    const source = {
      web: req.query.web !== 'false',
      academic: req.query.academic === 'true',
      social: req.query.social === 'true',
      finance: req.query.finance === 'true'
    }

    const sourceMapping = {
      web: 'web',
      academic: 'scholar',
      social: 'social',
      finance: 'edgar'
    }

    const activeSources = Object.keys(source)
      .filter(k => source[k])
      .map(k => sourceMapping[k])

    const frontend = uuidv4()

    const { data } = await axios.post(
      'https://api.nekolabs.web.id/px?url=https://www.perplexity.ai/rest/sse/perplexity_ask',
      {
        params: {
          attachments: [],
          language: 'en-US',
          timezone: 'Asia/Jakarta',
          search_focus: 'internet',
          sources: activeSources.length ? activeSources : ['web'],
          frontend_uuid: frontend,
          mode: 'concise',
          model_preference: 'turbo',
          visitor_id: uuidv4(),
          frontend_context_uuid: uuidv4(),
          prompt_source: 'user',
          query_source: 'home',
          skip_search_enabled: true,
          use_schematized_api: true,
          supported_block_use_cases: ['answer_modes', 'search_result_widgets'],
          dsl_query: query,
          version: '2.18'
        },
        query_str: query
      },
      {
        headers: {
          'content-type': 'application/json',
          referer: 'https://www.perplexity.ai/search/',
          'user-agent':
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome Mobile',
          'x-request-id': frontend,
          'x-perplexity-request-reason': 'perplexity-query'
        }
      }
    )

    const lines = data.result?.content
      ?.split('\n')
      .filter(l => l.startsWith('data:'))
      .map(l => JSON.parse(l.slice(6)))

    const final = lines?.find(l => l.final_sse_message)
    if (!final) {
      return res.json({
        status: false,
        message: 'tidak ada hasil'
      })
    }

    const info = JSON.parse(final.text)
    const answer = JSON.parse(
      info.find(s => s.step_type === 'FINAL')?.content?.answer || '{}'
    ).answer

    const results =
      info.find(s => s.step_type === 'SEARCH_RESULTS')?.content?.web_results || []

    return res.json({
      status: true,
      query,
      answer,
      sources: activeSources,
      results
    })
  } catch (e) {
    return res.status(500).json({
      status: false,
      message: e.message
    })
  }
}