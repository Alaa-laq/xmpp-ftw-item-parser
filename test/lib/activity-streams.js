'use strict';

var parser = require('../../lib/activity-streams')
  , ltx    = require('ltx')


parser.setLogger({
    log: function() {},
    info: function() {},
    warn: function() {},
    error: function() {}
})

/* jshint -W030 */
describe('Parsing posts with \'activity streams\'', function() {

    it('Shouldn\'t act if no thread namespace', function() {
        var entity = { not: 'empty' }
        var item   = ltx.parse('<body/>')
        parser.parse(item, entity)
        entity.should.eql({ not: 'empty' })
    })

    it('Adds thread details', function() {

        var entity = {}
        var item = ltx.parse(
          '<item><entry xmlns="' + parser.NS_THREAD + '">' +
          '<thr:in-reply-to ' +
                'ref="tag:xmpp-ftw,2013:10" ' +
                'type="application/xhtml+xml" ' +
                'href="http://evilprofessor.co.uk/entries/1"/>' +
          '</entry></item>'
        )
        parser.parse(item, entity)
        entity.should.eql({
            'in-reply-to': {
                ref: 'tag:xmpp-ftw,2013:10',
                type: 'application/xhtml+xml',
                href: 'http://evilprofessor.co.uk/entries/1'
            }
        })
    })
    
    it('Adds target details', function() {
        
        var entity = {}
        var item = ltx.parse(
          '<item><entry xmlns="' + parser.NS_ATOM + '">' +
          '<activity:target>' +
              '<id>tag:xmpp-ftw.jit.su,news,item-20130113</id>' +
              '<activity:object-type>comment</activity:object-type>' +
          '</activity:target>' +
          '</entry></item>'
        )
        parser.parse(item, entity)
        entity.should.eql({
            target: {
                id: 'tag:xmpp-ftw.jit.su,news,item-20130113',
                'object-type': 'comment'
            }
        })
    })
    
    it('Adds rating details', function() {
        var entity = {}
        var item = ltx.parse(
          '<item><entry xmlns="' + parser.NS_REVIEW + '">' +
              '<review:rating>5.0</review:rating>' +
          '</entry></item>'
        )
        parser.parse(item, entity)
        entity.should.eql({
            review: {
                rating: 5
            }
        })
    })

})

describe('Building stanzas with \'activity streams\'', function() {

    it('Shouldn\'t add elements if no data attribute provided', function() {
        var stanza = ltx.parse('<item><entry xmlns="' + parser.NS_ATOM + '"/></item>')
        var original = ltx.parse(stanza.toString())
        var entry = {}
        parser.build(entry, stanza)
        stanza.root().toString().should.equal(original.root().toString())
    })

    it('Shouldn\'t get built if there\'s no atom namespace', function() {
        var stanza = ltx.parse('<item><entry/></item>')
        var entry = { 'in-reply-to': {} }
        parser.build(entry, stanza)
        stanza.root().toString().should.equal('<item><entry/></item>')
    })

    it('Should add namespace to parent element', function() {
        var stanza = ltx.parse('<item><entry xmlns="' + parser.NS_ATOM + '"/></item>')
        var entry = { 'in-reply-to': {} }
        parser.build(entry, stanza)
        stanza.root().getChild('entry').attrs['xmlns:' + parser.PREFIX_NS_THREAD]
            .should.equal(parser.NS_THREAD)
    })

    it('Adds expected <in-reply-to/> element', function() {
        var stanza = ltx.parse('<item><entry xmlns="' + parser.NS_ATOM + '"/></item>')
        var entry = { 'in-reply-to': {
            ref: 'tag:xmpp-ftw,2013:10',
            type: 'application/xhtml+xml',
            href: 'http://evilprofessor.co.uk/entires/1'
        } }
        parser.build(entry, stanza)
        stanza.root().getChild('entry').attrs['xmlns:' + parser.PREFIX_NS_THREAD]
            .should.equal(parser.NS_THREAD)
        var inReplyTo = stanza.root().getChild('entry').getChild('in-reply-to')
        inReplyTo.should.exist
        inReplyTo.attrs.ref.should.equal(entry['in-reply-to'].ref)
        inReplyTo.attrs.type.should.equal(entry['in-reply-to'].type)
        inReplyTo.attrs.href.should.equal(entry['in-reply-to'].href)
    })
    
    it('Adds <target/> element and namespace', function() {
        var stanza = ltx.parse('<item><entry xmlns="' + parser.NS_ATOM + '"/></item>')
        var entry = {
            target: {
                id: 'tag:xmpp-ftw.jit.su,news,item-20130113',
                'object-type': 'comment'
            }
        }
        parser.build(entry, stanza)
        stanza.root().getChild('entry').attrs['xmlns:' + parser.PREFIX_NS_ACTIVITY]
            .should.equal(parser.NS_ACTIVITY)
        var target = stanza.root().getChild('entry').getChild('target')
        target.should.exist
        target.getChildText('id').should.equal(entry.target.id)
        target.getChildText('object-type').should.equal(entry.target['object-type'])
    })
    
    it('Adds <rating/> element and namespace', function() {
        var stanza = ltx.parse('<item><entry xmlns="' + parser.NS_ATOM + '"/></item>')
        var entry = {
            review: {
                rating: 5
            }
        }
        parser.build(entry, stanza)
        stanza.root().getChild('entry').attrs['xmlns:' + parser.PREFIX_NS_REVIEW]
            .should.equal(parser.NS_REVIEW)
        var rating = stanza.root().getChild('entry').getChild('rating')
        rating.should.exist
        rating.getText().should.equal(entry.review.rating.toString())
    })

})